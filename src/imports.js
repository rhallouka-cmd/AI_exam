const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const parse = require('csv-parse/sync');
const xlsx = require('xlsx');
const db = require('./database');
const { verifyToken } = require('./auth');

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.csv', '.xlsx', '.xls'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  }
});

// Parse CSV file
const parseCSV = (filePath) => {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const records = parse.parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  return records;
};

// Parse XLSX file
const parseXLSX = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const records = xlsx.utils.sheet_to_json(worksheet);
  return records;
};

// POST: Upload and preview file
router.post('/preview', verifyToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const ext = path.extname(req.file.originalname).toLowerCase();
    let records = [];

    if (ext === '.csv') {
      records = parseCSV(req.file.path);
    } else if (['.xlsx', '.xls'].includes(ext)) {
      records = parseXLSX(req.file.path);
    }

    // Return first 5 rows for preview and column names
    const preview = records.slice(0, 5);
    const columns = Object.keys(records[0] || {});

    res.json({
      success: true,
      filename: req.file.originalname,
      filepath: req.file.path,
      totalRows: records.length,
      columns,
      preview,
      message: `File preview loaded. ${records.length} total rows found.`
    });
  } catch (error) {
    res.status(400).json({ error: 'Error parsing file: ' + error.message });
  }
});

// POST: Import students from file with mapping
router.post('/import', verifyToken, (req, res) => {
  const { filepath, mapping } = req.body;

  if (!filepath || !mapping) {
    return res.status(400).json({ error: 'Missing filepath or mapping' });
  }

  // Validate filepath to prevent directory traversal
  if (!filepath.startsWith(uploadsDir)) {
    return res.status(400).json({ error: 'Invalid file path' });
  }

  if (!fs.existsSync(filepath)) {
    return res.status(400).json({ error: 'File not found' });
  }

  try {
    const ext = path.extname(filepath).toLowerCase();
    let records = [];

    if (ext === '.csv') {
      records = parseCSV(filepath);
    } else if (['.xlsx', '.xls'].includes(ext)) {
      records = parseXLSX(filepath);
    }

    // Parse mapping (map from file columns to student fields)
    const fieldMapping = {};
    Object.keys(mapping).forEach(key => {
      if (mapping[key]) {
        fieldMapping[mapping[key]] = key;
      }
    });

    let successCount = 0;
    const errors = [];

    // Process each record
    records.forEach((record, index) => {
      const student = {};
      let hasRequiredFields = true;

      // Map columns according to mapping
      Object.keys(fieldMapping).forEach(studentField => {
        const fileColumn = fieldMapping[studentField];
        if (record[fileColumn]) {
          student[studentField] = record[fileColumn];
        }
      });

      // Validate required fields
      if (!student.fullName || !student.email) {
        hasRequiredFields = false;
        errors.push(`Row ${index + 1}: Missing required fields (fullName, email)`);
        return;
      }

      // Create student
      db.createStudent(student, (err, studentId) => {
        if (err) {
          errors.push(`Row ${index + 1}: ${err.message}`);
        } else {
          successCount++;
        }
      });
    });

    // Store import record
    db.createImport(
      path.basename(filepath),
      req.user.id,
      JSON.stringify(mapping),
      (err, importId) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to record import' });
        }

        // Update import status
        const errorJson = errors.length > 0 ? JSON.stringify(errors) : null;
        db.updateImportStatus(importId, 'completed', successCount, errorJson, () => {
          // Clean up uploaded file
          fs.unlink(filepath, (err) => {
            if (err) console.error('Error deleting file:', err);
          });

          res.json({
            success: true,
            importId,
            successCount,
            failureCount: errors.length,
            errors: errors.slice(0, 10), // Show first 10 errors
            message: `Import completed: ${successCount} students imported, ${errors.length} errors`
          });
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Import failed: ' + error.message });
  }
});

// GET: Get import history
router.get('/history', verifyToken, (req, res) => {
  db.getImportsByUser(req.user.id, (err, imports) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch import history' });
    }

    // Parse errors and mapping from JSON strings
    const formattedImports = imports.map(imp => ({
      ...imp,
      mapping: imp.mapping ? JSON.parse(imp.mapping) : {},
      errors: imp.errors ? JSON.parse(imp.errors) : []
    }));

    res.json(formattedImports);
  });
});

// GET: Get import details
router.get('/:id', verifyToken, (req, res) => {
  db.getImportById(req.params.id, (err, importRecord) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch import' });
    }

    if (!importRecord) {
      return res.status(404).json({ error: 'Import not found' });
    }

    res.json({
      ...importRecord,
      mapping: importRecord.mapping ? JSON.parse(importRecord.mapping) : {},
      errors: importRecord.errors ? JSON.parse(importRecord.errors) : []
    });
  });
});

module.exports = router;
