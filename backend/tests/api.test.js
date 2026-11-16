import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';

const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'test-admin-password';
import express from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// Set up env variables before imports
process.env.JWT_SECRET = 'test_jwt_secret_key_12345';
process.env.PORT = '5999'; // Test port

// Import models
import User from '../models/User.js';
import Property from '../models/Property.js';

// Import routes
import authRoutes from '../routes/authRoutes.js';
import propertyRoutes from '../routes/propertyRoutes.js';

describe('Bhumi Era API Test Suite', () => {
  let app;
  let server;
  let baseUrl;
  let authToken;
  let initialUploadsFiles = [];

  // Mock DB State
  let mockProperties = [];

  // Reset database state before each test
  beforeEach(() => {
    mockProperties = [
      {
        _id: 'prop_1',
        propertyName: 'Bhumi Era Phase 1',
        zoneClassification: 'Residential',
        frontFacing: 'East',
        roadWidthFt: 40,
        roadConnectivity: 'Main Highway',
        lengthM: 50,
        widthM: 30,
        ratePerSqFt: 1500,
        cluAvailability: 'Available',
        nearbyRoadName: 'G.T. Road',
        latitude: 28.6139,
        longitude: 77.2090,
        mediaFiles: []
      },
      {
        _id: 'prop_2',
        propertyName: 'Bhumi Commercial Plot',
        zoneClassification: 'Commercial',
        frontFacing: 'North',
        roadWidthFt: 60,
        roadConnectivity: 'State Highway',
        lengthM: 100,
        widthM: 80,
        ratePerSqFt: 2500,
        cluAvailability: 'In-Process',
        nearbyRoadName: 'NH-44',
        latitude: 30.7333,
        longitude: 76.7794,
        mediaFiles: ['uploads/mock_file.jpg']
      }
    ];
  });

  before(async () => {
    // Record uploads folder state
    if (fs.existsSync('uploads')) {
      initialUploadsFiles = fs.readdirSync('uploads');
    }

    // Set up Mongoose Model Mocks
    
    // User mocks
    User.findOne = async (query) => {
      if (query.email && query.email.toLowerCase() === 'error@bhumiera.com') {
        throw new Error('Database connection failure simulated');
      }
      if (query.email && query.email.toLowerCase() === 'admin@bhumiera.com') {
        const bcrypt = await import('bcryptjs');
        const hashedPassword = bcrypt.default.hashSync(TEST_ADMIN_PASSWORD, 10);
        return {
          _id: 'mock_admin_id',
          email: 'admin@bhumiera.com',
          password: hashedPassword
        };
      }
      return null;
    };

    User.findById = (id) => {
      return {
        select: (fields) => {
          if (id === 'mock_admin_id') {
            return Promise.resolve({
              _id: 'mock_admin_id',
              email: 'admin@bhumiera.com'
            });
          }
          return Promise.resolve(null);
        }
      };
    };

    // Property mocks
    Property.find = () => {
      // Return a query chain representation
      return {
        sort: (criteria) => {
          if (mockProperties.some(p => p.propertyName === 'SimulateError')) {
            return Promise.reject(new Error('Database error during find'));
          }
          return Promise.resolve([...mockProperties]);
        }
      };
    };

    Property.findById = async (id) => {
      if (id === 'error_id') {
        throw new Error('Database error during findById');
      }
      const prop = mockProperties.find(p => p._id === id);
      return prop || null;
    };

    Property.prototype.save = async function() {
      if (this.propertyName === 'SimulateError') {
        throw new Error('Database error during save');
      }
      const newProp = {
        _id: 'prop_' + (mockProperties.length + 1),
        propertyName: this.propertyName,
        zoneClassification: this.zoneClassification,
        frontFacing: this.frontFacing,
        roadWidthFt: this.roadWidthFt,
        roadConnectivity: this.roadConnectivity,
        lengthM: this.lengthM,
        widthM: this.widthM,
        ratePerSqFt: this.ratePerSqFt,
        cluAvailability: this.cluAvailability,
        nearbyRoadName: this.nearbyRoadName,
        latitude: this.latitude,
        longitude: this.longitude,
        mediaFiles: this.mediaFiles || []
      };
      mockProperties.push(newProp);
      return newProp;
    };

    Property.findByIdAndUpdate = async (id, update, options) => {
      if (id === 'error_id') {
        throw new Error('Database error during findByIdAndUpdate');
      }
      const index = mockProperties.findIndex(p => p._id === id);
      if (index === -1) return null;
      const current = mockProperties[index];
      const updatedFields = update.$set || update;
      const updated = {
        ...current,
        ...updatedFields
      };
      mockProperties[index] = updated;
      return updated;
    };

    Property.findByIdAndDelete = async (id) => {
      if (id === 'error_id') {
        throw new Error('Database error during findByIdAndDelete');
      }
      const index = mockProperties.findIndex(p => p._id === id);
      if (index === -1) return null;
      const deleted = mockProperties.splice(index, 1)[0];
      return deleted;
    };

    // Build Test Express Server
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use('/api/auth', authRoutes);
    app.use('/api/properties', propertyRoutes);

    // Start server on dynamic port
    server = app.listen(0);
    const { port } = server.address();
    baseUrl = `http://localhost:${port}`;

    // Create a mock token for auth routes
    authToken = jwt.sign({ id: 'mock_admin_id' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  after(() => {
    // Close Express server
    if (server) {
      server.close();
    }

    // Clean up uploaded files in uploads/ that were created during the test
    if (fs.existsSync('uploads')) {
      const currentFiles = fs.readdirSync('uploads');
      currentFiles.forEach(file => {
        if (!initialUploadsFiles.includes(file)) {
          try {
            fs.unlinkSync(path.join('uploads', file));
          } catch (err) {
            console.error(`Clean up file failed for ${file}:`, err);
          }
        }
      });
    }
  });

  // --- Auth Route Tests ---
  describe('POST /api/auth/login', () => {
    test('should login successfully with correct credentials', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@bhumiera.com',
          password: TEST_ADMIN_PASSWORD
        })
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.message, 'Login successful!');
      assert.ok(body.token);
      assert.strictEqual(body.user.email, 'admin@bhumiera.com');
    });

    test('should return 400 if email or password is missing', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@bhumiera.com'
        })
      });

      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.message, 'Please provide email and password');
    });

    test('should return 401 for incorrect credentials', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@bhumiera.com',
          password: 'WrongPassword'
        })
      });

      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.message, 'Invalid email or password');
    });

    test('should return 500 on database error during login', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'error@bhumiera.com',
          password: 'Password123'
        })
      });

      const body = await res.json();
      assert.strictEqual(res.status, 500);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.message, 'Server Error during login');
    });
  });

  // --- Auth Middleware Tests ---
  describe('Authorization Middleware Check', () => {
    test('should return 401 if authorization header is missing', async () => {
      const res = await fetch(`${baseUrl}/api/properties`);
      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.message, 'Not authorized, no token provided');
    });

    test('should return 401 if token is invalid or poorly formatted', async () => {
      const res = await fetch(`${baseUrl}/api/properties`, {
        headers: { 'Authorization': 'Bearer invalid_token_xyz' }
      });
      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.message, 'Not authorized, token failed');
    });
  });

  // --- Property GET Routes ---
  describe('GET /api/properties', () => {
    test('should fetch all properties successfully', async () => {
      const res = await fetch(`${baseUrl}/api/properties`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.count, 2);
      assert.strictEqual(body.data.length, 2);
      assert.strictEqual(body.data[0].propertyName, 'Bhumi Era Phase 1');
    });

    test('should return 500 if database fails', async () => {
      mockProperties.push({ propertyName: 'SimulateError' });
      const res = await fetch(`${baseUrl}/api/properties`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const body = await res.json();
      assert.strictEqual(res.status, 500);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.message, 'Server Error fetching properties');
    });
  });

  describe('GET /api/properties/:id', () => {
    test('should fetch a single property by ID successfully', async () => {
      const res = await fetch(`${baseUrl}/api/properties/prop_1`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.propertyName, 'Bhumi Era Phase 1');
    });

    test('should return 404 if property ID does not exist', async () => {
      const res = await fetch(`${baseUrl}/api/properties/nonexistent_id`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const body = await res.json();
      assert.strictEqual(res.status, 404);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.message, 'Property not found');
    });

    test('should return 500 on database error during fetch by ID', async () => {
      const res = await fetch(`${baseUrl}/api/properties/error_id`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const body = await res.json();
      assert.strictEqual(res.status, 500);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.message, 'Server Error fetching property');
    });
  });

  // --- Property Create/Post Routes ---
  describe('POST /api/properties', () => {
    test('should create a new property with valid JSON payload', async () => {
      const payload = {
        propertyName: 'New Garden Town',
        zoneClassification: 'Residential',
        frontFacing: 'South',
        roadWidthFt: 30,
        roadConnectivity: 'Link Road',
        lengthM: 40,
        widthM: 25,
        ratePerSqFt: 1200,
        cluAvailability: 'Available',
        nearbyRoadName: 'G.T. Road Extension',
        latitude: 28.5200,
        longitude: 77.2500
      };

      const res = await fetch(`${baseUrl}/api/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.message, 'Property created successfully!');
      assert.strictEqual(body.data.propertyName, 'New Garden Town');
      assert.strictEqual(body.data.roadWidthFt, 30);
    });

    test('should successfully use alternative endpoint POST /api/properties/add', async () => {
      const payload = {
        propertyName: 'Custom Route Add Property',
        cluAvailability: 'Not Available'
      };

      const res = await fetch(`${baseUrl}/api/properties/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.propertyName, 'Custom Route Add Property');
      assert.strictEqual(body.data.cluAvailability, 'Not Available');
    });

    test('should successfully use alternative endpoint POST /api/properties/create', async () => {
      const payload = {
        propertyName: 'Custom Route Create Property'
      };

      const res = await fetch(`${baseUrl}/api/properties/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.propertyName, 'Custom Route Create Property');
    });

    test('should return 500 on database error during creation', async () => {
      const payload = {
        propertyName: 'SimulateError'
      };

      const res = await fetch(`${baseUrl}/api/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      const body = await res.json();
      assert.strictEqual(res.status, 500);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.message, 'Server Error creating property');
    });

    test('should successfully upload files using multipart/form-data', async () => {
      const formData = new FormData();
      formData.append('propertyName', 'Multipart Property');
      formData.append('zoneClassification', 'Industrial');
      
      const fileBlob = new Blob(['sample image data'], { type: 'image/jpeg' });
      formData.append('files', fileBlob, 'test_image.jpg');

      const res = await fetch(`${baseUrl}/api/properties`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.propertyName, 'Multipart Property');
      assert.ok(body.data.mediaFiles.length > 0);
      assert.ok(body.data.mediaFiles[0].includes('uploads/'));
    });
  });

  // --- Property PUT/Update Routes ---
  describe('PUT/POST Update /api/properties/:id', () => {
    test('should update a property successfully using PUT', async () => {
      const payload = {
        propertyName: 'Updated Phase 1 Name',
        ratePerSqFt: 1800
      };

      const res = await fetch(`${baseUrl}/api/properties/prop_1`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.message, 'Property updated successfully!');
      assert.strictEqual(body.data.propertyName, 'Updated Phase 1 Name');
      assert.strictEqual(body.data.ratePerSqFt, 1800);
    });

    test('should update a property successfully using alternative endpoint POST /api/properties/update/:id', async () => {
      const payload = {
        propertyName: 'Updated Via Post Endpoint',
        zoneClassification: 'Special Zone'
      };

      const res = await fetch(`${baseUrl}/api/properties/update/prop_1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.propertyName, 'Updated Via Post Endpoint');
      assert.strictEqual(body.data.zoneClassification, 'Special Zone');
    });

    test('should handle deletion of files on update', async () => {
      const payload = {
        deleteFiles: JSON.stringify(['uploads/mock_file.jpg'])
      };

      const res = await fetch(`${baseUrl}/api/properties/prop_2`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.deepStrictEqual(body.data.mediaFiles, []);
    });

    test('should return 404 on update if property is not found', async () => {
      const res = await fetch(`${baseUrl}/api/properties/nonexistent_id`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ propertyName: 'Will Fail' })
      });

      const body = await res.json();
      assert.strictEqual(res.status, 404);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.message, 'Property not found');
    });

    test('should return 500 on update database error', async () => {
      const res = await fetch(`${baseUrl}/api/properties/error_id`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ propertyName: 'Will Fail' })
      });

      const body = await res.json();
      assert.strictEqual(res.status, 500);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.message, 'Server Error updating property');
    });
  });

  // --- Property DELETE Routes ---
  describe('DELETE /api/properties/:id', () => {
    test('should delete a property successfully using DELETE', async () => {
      const res = await fetch(`${baseUrl}/api/properties/prop_1`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.message, 'Property and its files deleted successfully!');
      
      // Verify deletion in DB list
      assert.strictEqual(mockProperties.find(p => p._id === 'prop_1'), undefined);
    });

    test('should delete a property successfully using alternative endpoint POST /api/properties/delete/:id', async () => {
      const res = await fetch(`${baseUrl}/api/properties/delete/prop_2`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.message, 'Property and its files deleted successfully!');
      
      // Verify deletion in DB list
      assert.strictEqual(mockProperties.find(p => p._id === 'prop_2'), undefined);
    });

    test('should return 404 on delete if property does not exist', async () => {
      const res = await fetch(`${baseUrl}/api/properties/nonexistent_id`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const body = await res.json();
      assert.strictEqual(res.status, 404);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.message, 'Property not found');
    });

    test('should return 500 on delete database error', async () => {
      const res = await fetch(`${baseUrl}/api/properties/error_id`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const body = await res.json();
      assert.strictEqual(res.status, 500);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.message, 'Server Error deleting property');
    });
  });
});
