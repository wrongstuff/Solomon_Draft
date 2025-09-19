import React from 'react';

/**
 * Header component displaying the application title and branding
 */
export const Header: React.FC = () => {
  return (
    <header className="bg-blue-600 text-white py-6">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center">
          Solomon Draft App
        </h1>
        <p className="text-center text-blue-100 mt-2">
          Asynchronous Magic: The Gathering Draft Simulator
        </p>
      </div>
    </header>
  );
};



