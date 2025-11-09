import { PrismaClient } from '@prisma/client';
import { documentService } from '../documentService';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Test data
let testUserId: string;
let testAccountId: string;
const testUploadDir = './uploads';

beforeAll(async () => {
  // Create test user
  let testUser = await prisma.user.findUnique({
    where: { email: 'test@documentservice.test' },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'test@documentservice.test',
        name: 'Test User',
      },
    });
  }

  testUserId = testUser.id;

  // Create test account
  const testAccount = await prisma.account.create({
    data: {
      name: 'Test Account',
      type: 'CHECKING',
      userId: testUserId,
    },
  });

  testAccountId = testAccount.id;

  // Ensure upload directory exists
  if (!fs.existsSync(testUploadDir)) {
    fs.mkdirSync(testUploadDir, { recursive: true });
  }
});

afterAll(async () => {
  // Clean up test data
  if (testUserId) {
    await prisma.transaction.deleteMany({ where: { userId: testUserId } });
    await prisma.document.deleteMany({});
    await prisma.account.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  }

  // Clean up test files
  if (fs.existsSync(testUploadDir)) {
    const files = fs.readdirSync(testUploadDir);
    files.forEach(file => {
      const filePath = path.join(testUploadDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  }

  await prisma.$disconnect();
});

afterEach(async () => {
  // Clean up documents after each test
  await prisma.transaction.deleteMany({ where: { userId: testUserId } });
  await prisma.document.deleteMany({});

  // Clean up test files
  if (fs.existsSync(testUploadDir)) {
    const files = fs.readdirSync(testUploadDir);
    files.forEach(file => {
      const filePath = path.join(testUploadDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  }
});

describe('Document Service', () => {
  describe('createDocument', () => {
    it('should create a document with valid data', async () => {
      const documentData = {
        filename: 'test-file.pdf',
        originalName: 'original-file.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: './uploads/test-file.pdf',
      };

      const document = await documentService.createDocument(documentData);

      expect(document).toBeDefined();
      expect(document.id).toBeDefined();
      expect(document.filename).toBe('test-file.pdf');
      expect(document.originalName).toBe('original-file.pdf');
      expect(document.mimeType).toBe('application/pdf');
      expect(document.size).toBe(1024);
      expect(document.path).toBe('./uploads/test-file.pdf');
      expect(document.uploadedAt).toBeDefined();
    });

    it('should create a document with image mime type', async () => {
      const documentData = {
        filename: 'test-image.jpg',
        originalName: 'receipt.jpg',
        mimeType: 'image/jpeg',
        size: 2048,
        path: './uploads/test-image.jpg',
      };

      const document = await documentService.createDocument(documentData);

      expect(document.mimeType).toBe('image/jpeg');
      expect(document.filename).toBe('test-image.jpg');
    });
  });

  describe('getDocumentById', () => {
    it('should return document when it exists', async () => {
      const created = await documentService.createDocument({
        filename: 'find-me.pdf',
        originalName: 'original.pdf',
        mimeType: 'application/pdf',
        size: 512,
        path: './uploads/find-me.pdf',
      });

      const document = await documentService.getDocumentById(created.id);

      expect(document).toBeDefined();
      expect(document?.id).toBe(created.id);
      expect(document?.filename).toBe('find-me.pdf');
    });

    it('should return null when document does not exist', async () => {
      const document = await documentService.getDocumentById('non-existent-id');
      expect(document).toBeNull();
    });
  });

  describe('getDocumentTransactions', () => {
    it('should return transactions linked to a document', async () => {
      const document = await documentService.createDocument({
        filename: 'statement.pdf',
        originalName: 'bank-statement.pdf',
        mimeType: 'application/pdf',
        size: 4096,
        path: './uploads/statement.pdf',
      });

      // Create transactions linked to document
      await prisma.transaction.createMany({
        data: [
          {
            date: new Date('2024-01-15'),
            amount: 100,
            type: 'EXPENSE',
            description: 'Transaction 1',
            accountId: testAccountId,
            userId: testUserId,
            documentId: document.id,
          },
          {
            date: new Date('2024-01-20'),
            amount: 50,
            type: 'INCOME',
            description: 'Transaction 2',
            accountId: testAccountId,
            userId: testUserId,
            documentId: document.id,
          },
        ],
      });

      const transactions = await documentService.getDocumentTransactions(document.id);

      expect(transactions).toBeDefined();
      expect(transactions).toHaveLength(2);
      expect(transactions![0].description).toBe('Transaction 2'); // Ordered by date desc
      expect(transactions![1].description).toBe('Transaction 1');
    });

    it('should return empty array when document has no transactions', async () => {
      const document = await documentService.createDocument({
        filename: 'empty.pdf',
        originalName: 'empty-doc.pdf',
        mimeType: 'application/pdf',
        size: 256,
        path: './uploads/empty.pdf',
      });

      const transactions = await documentService.getDocumentTransactions(document.id);

      expect(transactions).toBeDefined();
      expect(transactions).toHaveLength(0);
    });

    it('should return null when document does not exist', async () => {
      const transactions = await documentService.getDocumentTransactions('non-existent-id');
      expect(transactions).toBeNull();
    });
  });

  describe('validateFileType', () => {
    it('should accept PDF files', () => {
      expect(documentService.validateFileType('application/pdf')).toBe(true);
    });

    it('should accept JPEG files', () => {
      expect(documentService.validateFileType('image/jpeg')).toBe(true);
      expect(documentService.validateFileType('image/jpg')).toBe(true);
    });

    it('should accept PNG files', () => {
      expect(documentService.validateFileType('image/png')).toBe(true);
    });

    it('should reject invalid file types', () => {
      expect(documentService.validateFileType('application/msword')).toBe(false);
      expect(documentService.validateFileType('text/plain')).toBe(false);
      expect(documentService.validateFileType('video/mp4')).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    it('should accept files within size limit', () => {
      expect(documentService.validateFileSize(1024)).toBe(true);
      expect(documentService.validateFileSize(5242880)).toBe(true); // 5MB
    });

    it('should reject files exceeding size limit', () => {
      const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);
      expect(documentService.validateFileSize(maxSize + 1)).toBe(false);
      expect(documentService.validateFileSize(20971520)).toBe(false); // 20MB
    });

    it('should accept files at exact size limit', () => {
      const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);
      expect(documentService.validateFileSize(maxSize)).toBe(true);
    });
  });

  describe('generateFilePath', () => {
    it('should generate correct file path', () => {
      const filename = 'test-file.pdf';
      const expectedPath = path.join(process.env.UPLOAD_DIR || './uploads', filename);
      const generatedPath = documentService.generateFilePath(filename);

      expect(generatedPath).toBe(expectedPath);
    });

    it('should handle different filenames', () => {
      const filename = 'receipt-12345.jpg';
      const generatedPath = documentService.generateFilePath(filename);

      expect(generatedPath).toContain(filename);
      expect(generatedPath).toContain('uploads');
    });
  });
});
