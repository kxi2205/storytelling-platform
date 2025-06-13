import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom'; // For context if Link or navigate is used
import CreateStoryPage from './CreateStoryPage';

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // use actual for all non-hook parts
  useNavigate: () => mockNavigate,
  useParams: () => ({ storyId: undefined }), // For CreateStoryPage, storyId is usually not from params
}));

// Mock global fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(file => `blob:http://localhost:3000/${file.name}-preview`);
global.URL.revokeObjectURL = jest.fn();


// Helper to create a File object
const createMockFile = (name, size, type) => {
  const file = new File(['dummy content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('CreateStoryPage Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    fetch.mockClear();
    mockNavigate.mockClear();
    global.URL.createObjectURL.mockClear();
    global.URL.revokeObjectURL.mockClear();

    // Default successful mock for story initialization
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        _id: 'mockStoryId123',
        title: 'Untitled Story',
        characters: [],
        chapters: []
      }),
    });
  });

  test('renders Step 1 initially and allows title input', async () => {
    render(
      <MemoryRouter>
        <CreateStoryPage />
      </MemoryRouter>
    );

    // Wait for initialization (story ID to be set)
    await waitFor(() => expect(screen.getByText(/Step 1 of 3/i)).toBeInTheDocument());

    expect(screen.getByRole('heading', { name: /Step 1: Basic Info & Cover/i })).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/Title:/i);
    expect(titleInput).toBeInTheDocument();
    expect(titleInput.value).toBe('Untitled Story'); // Default or from mocked init

    fireEvent.change(titleInput, { target: { value: 'My Awesome Story' } });
    expect(titleInput.value).toBe('My Awesome Story');
  });

  test('allows cover page file selection and shows preview in Step 1', async () => {
    render(
      <MemoryRouter>
        <CreateStoryPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText(/Step 1 of 3/i)).toBeInTheDocument());

    const fileInput = screen.getByLabelText(/Cover Page Image/i);
    expect(fileInput).toBeInTheDocument();

    const testFile = createMockFile('test-cover.png', 1024 * 1024, 'image/png'); // 1MB

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    // Check if createObjectURL was called
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(testFile);

    // Check for preview image
    const previewImage = await screen.findByAltText('Cover Preview');
    expect(previewImage).toBeInTheDocument();
    expect(previewImage.src).toBe(`blob:http://localhost:3000/${testFile.name}-preview`);
  });

  test('shows error for invalid file type in Step 1', async () => {
    render(
      <MemoryRouter>
        <CreateStoryPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText(/Step 1 of 3/i)).toBeInTheDocument());

    const fileInput = screen.getByLabelText(/Cover Page Image/i);
    const invalidFile = createMockFile('test-document.txt', 1024, 'text/plain');

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(await screen.findByText(/Invalid file type. Only JPG\/JPEG and PNG are allowed./i)).toBeInTheDocument();
    expect(fileInput.value).toBe(''); // Input should be cleared
    expect(screen.queryByAltText('Cover Preview')).not.toBeInTheDocument();
  });

  test('shows error for file size too large in Step 1', async () => {
    render(
      <MemoryRouter>
        <CreateStoryPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText(/Step 1 of 3/i)).toBeInTheDocument());

    const fileInput = screen.getByLabelText(/Cover Page Image/i);
    const largeFile = createMockFile('large-image.png', 3 * 1024 * 1024, 'image/png'); // 3MB

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(await screen.findByText(/File is too large. Maximum size is 2MB./i)).toBeInTheDocument();
    expect(fileInput.value).toBe('');
    expect(screen.queryByAltText('Cover Preview')).not.toBeInTheDocument();
  });

  test('navigates to Step 2 on "Next" click after successful save of Step 1', async () => {
    // Mock a successful save for Step 1
    fetch.mockResolvedValueOnce({ // This is for the saveStepData(1) call
        ok: true,
        json: async () => ({ _id: 'mockStoryId123', title: 'My Awesome Story', coverPageUrl: null }),
    });

    render(
      <MemoryRouter>
        <CreateStoryPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText(/Step 1 of 3/i)).toBeInTheDocument());

    const titleInput = screen.getByLabelText(/Title:/i);
    fireEvent.change(titleInput, { target: { value: 'My Awesome Story' } });

    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    // Wait for save and navigation
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2)); // 1 for init, 1 for save
    expect(screen.getByRole('heading', { name: /Step 2: Add Characters/i })).toBeInTheDocument();
  });

  // TODO: Add tests for Step 2 (Character Management)
  // - Adding a character updates the list
  // - Removing a character updates the list
  // - Validation for character form

  // TODO: Add tests for Step 3 (Chapter Management)
  // - Adding/editing/removing chapters
  // - ReactQuill interaction (mocking ReactQuill might be necessary for deeper tests or use its API)
  // - Preview modal

  // TODO: Test "Save Draft" functionality for each step
  // TODO: Test "Previous" button navigation
  // TODO: Test "Finish & Save" on the last step and navigation
});
