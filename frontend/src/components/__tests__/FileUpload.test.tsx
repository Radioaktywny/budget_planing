import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FileUpload from '../FileUpload';

describe('FileUpload', () => {
  const mockOnFileSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload area with instructions', () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    expect(screen.getByText(/Click to upload/)).toBeInTheDocument();
    expect(screen.getByText(/drag and drop/)).toBeInTheDocument();
    expect(screen.getByText(/PDF, JPEG, PNG up to 10MB/)).toBeInTheDocument();
  });

  it('validates file type', () => {
    const { container } = render(<FileUpload onFileSelect={mockOnFileSelect} acceptedTypes={['application/pdf']} />);
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    
    Object.defineProperty(input, 'files', {
      value: [file],
    });
    
    fireEvent.change(input);
    
    expect(screen.getByText(/File type not supported/)).toBeInTheDocument();
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });

  it('validates file size', () => {
    const { container } = render(<FileUpload onFileSelect={mockOnFileSelect} maxSizeMB={1} />);
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    // Create a file larger than 1MB
    const largeContent = new Array(2 * 1024 * 1024).join('a');
    const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
    
    Object.defineProperty(input, 'files', {
      value: [file],
    });
    
    fireEvent.change(input);
    
    expect(screen.getByText(/File size exceeds 1MB limit/)).toBeInTheDocument();
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });

  it('calls onFileSelect with valid file', () => {
    const { container } = render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    
    Object.defineProperty(input, 'files', {
      value: [file],
    });
    
    fireEvent.change(input);
    
    expect(mockOnFileSelect).toHaveBeenCalledWith(file);
  });

  it('displays file preview for images', () => {
    const { container } = render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    
    Object.defineProperty(input, 'files', {
      value: [file],
    });
    
    fireEvent.change(input);
    
    expect(screen.getByText('test.jpg')).toBeInTheDocument();
  });

  it('allows clearing selected file', () => {
    const { container } = render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    
    Object.defineProperty(input, 'files', {
      value: [file],
    });
    
    fireEvent.change(input);
    
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    
    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);
    
    expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
    expect(screen.getByText(/Click to upload/)).toBeInTheDocument();
  });

  it('disables upload when disabled prop is true', () => {
    const { container } = render(<FileUpload onFileSelect={mockOnFileSelect} disabled={true} />);
    
    const uploadArea = container.querySelector('.border-dashed');
    expect(uploadArea).toHaveClass('opacity-50');
    expect(uploadArea).toHaveClass('cursor-not-allowed');
  });
});
