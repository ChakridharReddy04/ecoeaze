// src/components/Footer.tsx
import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-muted py-6 mt-10">
      <div className="container text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} EcoEaze. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
