import React from "react";

type Document = {
  id: string;
  title: string;
  uploadedAt: string; // ISO date or formatted
};

type Props = {
  documents?: Document[];
};

export default function UploadedDocuments({ documents = [] }: Props) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Uploaded Documents</h2>
        <button className="text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
            <path d="M2 2l7.586 7.586"></path>
          </svg>
        </button>
      </div>
      <div className="space-y-3">
        {documents.length === 0 ? (
          <p className="text-sm text-gray-500">No documents uploaded yet.</p>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{doc.title}</p>
                <p className="text-sm text-gray-500">Uploaded: {doc.uploadedAt}</p>
              </div>
              <button className="text-blue-600 hover:text-blue-800">Download</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
