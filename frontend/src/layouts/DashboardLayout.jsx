import React from 'react';
import Sidebar from '../components/common/Sidebar';
import Topbar from '../components/common/Topbar';

export default function DashboardLayout({ children, title, subtitle }) {
  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title={title} subtitle={subtitle} />
        <div className="page-body">
          {children}
        </div>
      </div>
    </div>
  );
}
