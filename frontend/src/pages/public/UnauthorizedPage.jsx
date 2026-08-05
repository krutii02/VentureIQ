import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--clr-bg-primary)' }}>
      <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} style={{ textAlign:'center', maxWidth:400, padding:40 }}>
        <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(239,68,68,0.15)', border:'2px solid rgba(239,68,68,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', fontSize:'2rem' }}>
          <Lock size={36} color="var(--clr-danger)" />
        </div>
        <h1 style={{ fontSize:'1.8rem', fontWeight:800, marginBottom:12 }}>Access Denied</h1>
        <p style={{ color:'var(--clr-text-muted)', marginBottom:32, lineHeight:1.6 }}>
          You don't have permission to view this page. Please sign in with the correct account type.
        </p>
        <Link to="/login" className="btn btn-primary"><ArrowLeft size={16}/> Back to Login</Link>
      </motion.div>
    </div>
  );
}
