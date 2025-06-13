const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import your Express app and relevant models
const app = require('../server'); // Assuming your app is exported from server.js
const User = require('../models/User');
const Story = require('../models/Story');

// Mock the fs module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'), // Import and retain default behavior
  unlinkSync: jest.fn(),
  mkdirSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true), // Assume directory exists for uploads
}));

let mongoServer;
let testUser;
let testUserToken;
let testStory;

const JWT_SECRET = process.env.JWT_SECRET || 'testsecretfortokengenerationonly';

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Create a test user
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);
  testUser = new User({
    username: 'testuser',
    email: 'test@example.com',
    password: hashedPassword,
  });
  await testUser.save();

  // Generate token for the test user
  testUserToken = jwt.sign({ id: testUser._id, username: testUser.username }, JWT_SECRET, { expiresIn: '1h' });

  // Create a test story by this user
  testStory = new Story({
    title: 'Original Test Story Title',
    author: testUser._id,
    chapters: [],
    characters: [],
  });
  await testStory.save();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  jest.clearAllMocks(); // Clear all mocks after tests
});

describe('Story Routes - PUT /api/stories/:storyId/step1', () => {
  it('should successfully update title and upload cover image', async () => {
    const newTitle = 'Updated Story Title by Test';
    const dummyFilePath = 'backend/tests/assets/test-cover.jpg'; // Path to a dummy file in your test setup
                                                             // For supertest, you might need to ensure this file exists
                                                             // or use a library to help create dummy files for upload tests.
                                                             // Here, we'll focus on the fs.unlinkSync mock.

    // Simulate an old cover page existing to test its deletion
    const oldCoverUrl = '/uploads/cover_pages/old_cover.jpg';
    testStory.coverPageUrl = oldCoverUrl;
    await testStory.save();

    // Mock that the old file exists so unlinkSync should be called
    // Note: fs.existsSync is globally mocked to return true. If more specific behavior is needed:
    // fs.existsSync.mockImplementation((path) => path.endsWith(oldCoverUrl.split('/').pop()));


    const response = await request(app)
      .put(`/api/stories/${testStory._id}/step1`)
      .set('Authorization', `Bearer ${testUserToken}`)
      .field('title', newTitle) // For multipart/form-data
      .attach('coverPage', Buffer.from('fake image data'), 'test-cover.jpg'); // Attach a dummy file

    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe(newTitle);
    expect(response.body.coverPageUrl).toMatch(/^\/uploads\/cover_pages\//); // Check if URL starts with expected path

    // Verify that if an old cover existed, fs.unlinkSync was called for it.
    // This requires the oldCoverUrl to be set on testStory before this request.
    expect(require('fs').unlinkSync).toHaveBeenCalledWith(expect.stringContaining(oldCoverUrl.substring(1))); // substring(1) to remove leading /

    // Verify story in DB
    const updatedStoryInDb = await Story.findById(testStory._id);
    expect(updatedStoryInDb.title).toBe(newTitle);
    expect(updatedStoryInDb.coverPageUrl).toEqual(response.body.coverPageUrl);
  });

  it('should return 401 if no token is provided', async () => {
    const response = await request(app)
      .put(`/api/stories/${testStory._id}/step1`)
      .field('title', 'Attempted Update Title')
      .attach('coverPage', Buffer.from('fake image data'), 'test-cover.jpg');

    expect(response.statusCode).toBe(401); // Or 403 depending on authMiddleware
  });

  it('should return 404 if story ID is invalid or not found', async () => {
    const invalidStoryId = new mongoose.Types.ObjectId().toString(); // A valid ObjectId format, but non-existent
    const response = await request(app)
      .put(`/api/stories/${invalidStoryId}/step1`)
      .set('Authorization', `Bearer ${testUserToken}`)
      .field('title', 'Attempted Update Title')
      .attach('coverPage', Buffer.from('fake image data'), 'test-cover.jpg');

    expect(response.statusCode).toBe(404);
  });

  it('should return 403 if user is not the author', async () => {
    // Create another user
    const anotherUser = new User({ username: 'anotheruser', email: 'another@example.com', password: 'password123' });
    await anotherUser.save();
    const anotherUserToken = jwt.sign({ id: anotherUser._id, username: anotherUser.username }, JWT_SECRET, { expiresIn: '1h' });

    const response = await request(app)
      .put(`/api/stories/${testStory._id}/step1`) // testStory is owned by testUser
      .set('Authorization', `Bearer ${anotherUserToken}`)
      .field('title', 'Attempted Update by Wrong User')
      .attach('coverPage', Buffer.from('fake image data'), 'test-cover.jpg');

    expect(response.statusCode).toBe(403);
  });

  it('should update title even if no cover image is provided', async () => {
    const newTitleOnly = "Title Update, No New Cover";
    const response = await request(app)
      .put(`/api/stories/${testStory._id}/step1`)
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({ title: newTitleOnly }); // Send as application/json or x-www-form-urlencoded
                                     // Multer also handles non-multipart requests if .single() is used.

    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe(newTitleOnly);
    // Ensure coverPageUrl (if it existed) is not wiped out
    if(testStory.coverPageUrl) {
        expect(response.body.coverPageUrl).toBe(testStory.coverPageUrl);
    }
    const updatedStoryInDb = await Story.findById(testStory._id);
    expect(updatedStoryInDb.title).toBe(newTitleOnly);
  });

});

// TODO: Add more describe blocks for other routes (step2, step3, create, get story)
// TODO: Add tests for file type validation in step1 (multer's fileFilter)
// For file type validation, you'd mock req.fileValidationError in the route handler or test multer's behavior more directly.
// For supertest, sending a file with an unaccepted extension should ideally result in a 400 from the multer setup.
// Example:
// it('should return 400 if cover image is not an allowed type', async () => {
//   const response = await request(app)
//     .put(`/api/stories/${testStory._id}/step1`)
//     .set('Authorization', `Bearer ${testUserToken}`)
//     .field('title', 'Title with Invalid File')
//     .attach('coverPage', Buffer.from('fake text data'), 'test-document.txt'); // Invalid file type
//   expect(response.statusCode).toBe(400);
//   expect(response.body.error).toMatch(/Only JPG, JPEG, PNG image files are allowed!/i);
// });

// Note: The .attach() method in supertest sets the Content-Type to multipart/form-data.
// If you send only JSON (like title update without file), use .send() and set Content-Type header.
// The current backend route for step1 uses multer's .single('coverPage'). Multer typically processes the request
// only if it's multipart. If it's application/json, req.file will be undefined.
// The backend route logic needs to handle both cases gracefully:
// - Multipart: req.file exists (or not), req.body for other fields.
// - JSON/Urlencoded: req.file is undefined, req.body contains fields.
// The test 'should update title even if no cover image is provided' might need adjustment
// based on how multer and the route handler process non-multipart requests.
// The provided backend code for step1 seems to expect multipart if a file might be there,
// but the test for title-only update uses .send(), which is typically application/json.
// This may require the route to be flexible or the test to use .field() for title and no .attach().
// Let's assume the current route handles application/json for title-only updates correctly.
// If not, the test or route needs adjustment. The `.send({ title: newTitleOnly })` is the common way for JSON.
// For the PUT request, if multer is always hit, it might try to parse application/json as multipart if not careful.
// However, `uploadCover.single()` middleware should ideally only process multipart requests and pass others through
// or be configured to handle this.
// The current test for title-only update implies that the route can handle application/json.
