'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, User, Menu, X, Search, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { totalItems } = useCart();
  const { user, logout, isAdmin, isReady } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 text-white transition-all duration-300 ${scrolled ? 'bg-[rgba(90,14,122,0.62)] backdrop-blur-md border-b border-white/15 py-2' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex-shrink-0">
            <Image src="/logo.svg" alt="Go Seven" width={130} height={48} className="h-10 w-auto" priority />
          </Link>

          <div className="hidden md:flex ml-10 items-baseline space-x-8">
            <Link href="/collections" className="hover:text-[#f1deff] transition-colors">Collections</Link>
            <Link href="/collections?filter=new" className="hover:text-[#f1deff] transition-colors">New Arrivals</Link>
            <Link href="/collections" className="hover:text-[#f1deff] transition-colors">Categories</Link>
            <Link href="/about" className="hover:text-[#f1deff] transition-colors">Our Story</Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <button className="hover:text-[#f1deff] transition-colors">
              <Search size={22} />
            </button>
            {isReady && user ? (
              <>
                {isAdmin && (
                  <Link href="/admin/products" className="hover:text-[#f1deff] transition-colors text-sm font-medium">
                    Admin
                  </Link>
                )}
                <Link href="/account" className="hover:text-[#f1deff] transition-colors text-sm font-medium">
                  Account
                </Link>
                <button onClick={logout} className="hover:text-[#f1deff] transition-colors text-sm font-medium">
                  Sign Out
                </button>
              </>
            ) : isReady ? (
              <Link href="/login" className="hover:text-[#f1deff] transition-colors">
                <User size={22} />
              </Link>
            ) : null}
            <Link href="/cart" className="relative hover:text-[#f1deff] transition-colors">
              <ShoppingCart size={22} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/20 focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-[rgba(90,14,122,0.88)] backdrop-blur-md border-t border-white/15 text-white"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/collections" className="block px-3 py-2 text-base font-medium hover:text-[#f1deff]">Collections</Link>
            <Link href="/collections?filter=new" className="block px-3 py-2 text-base font-medium hover:text-[#f1deff]">New Arrivals</Link>
            <Link href="/about" className="block px-3 py-2 text-base font-medium hover:text-[#f1deff]">Our Story</Link>
          </div>
          <div className="pt-4 pb-3 border-t border-white/20">
            <div className="flex flex-wrap items-center px-5 gap-4">
              <Link href={user ? '/account' : '/login'} className="flex items-center text-base font-medium hover:text-[#f1deff]">
                <User size={22} className="mr-2" /> {user ? 'Account' : 'Login'}
              </Link>
              {isReady && isAdmin && (
                <Link href="/admin/products" className="flex items-center text-base font-medium hover:text-[#f1deff]">
                  <ShieldCheck size={22} className="mr-2" /> Admin
                </Link>
              )}
              <Link href="/cart" className="flex items-center text-base font-medium hover:text-[#f1deff]">
                <ShoppingCart size={22} className="mr-2" /> Cart {totalItems > 0 && `(${totalItems})`}
              </Link>
              {isReady && user && (
                <button onClick={logout} className="text-base font-medium hover:text-[#f1deff]">
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
