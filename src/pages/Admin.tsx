import React, { useState } from 'react';

const Admin = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(
        'https://cloudflare-worker-r2-upload.jubbyb.workers.dev/upload',
        {
          method: 'POST',
          body: formData,
        },
      );

      if (response.ok) {
        alert('File uploaded successfully!');
      } else {
        const errorText = await response.text();
        alert(`Error uploading file: ${errorText}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please check the console for more details.');
    }
  };

  return (
  



// Option 3: Full-width with loading state
<div className="w-full max-w-md mx-auto p-6 bg-base-100 rounded-lg shadow-lg">
  <div className="space-y-4">
    <div className="form-control">
      <label className="label">
        <span className="label-text font-medium">Select Image</span>
      </label>
      <input 
        type="file" 
        className="file-input file-input-bordered file-input-primary w-full" 
        onChange={handleFileChange}
        accept="image/*"
      />
    </div>
    <button 
      type="submit" 
      className="btn btn-primary w-full"
      onClick={handleUpload}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      Upload Image
    </button>
  </div>
</div>





  );
};

export default Admin;
