'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ShoppingCart, User, Menu, X, Search, ShieldCheck, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const currentSearch = searchParams.get('search') || '';
  const currentFilter = searchParams.get('filter') || '';
  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const { totalItems } = useCart();
  const { user, logout, isAdmin, isReady } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setIsSearchOpen(false);
    setSearchQuery(currentSearch);
  }, [pathname, searchKey]);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    const normalizedQuery = searchQuery.trim();

    if (pathname === '/collections' && currentFilter) {
      params.set('filter', currentFilter);
    }

    if (normalizedQuery) {
      params.set('search', normalizedQuery);
    }

    router.push(`/collections${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const toggleSearch = () => {
    setIsOpen(false);
    setIsSearchOpen((open) => !open);
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <nav className={`fixed w-full z-50 text-white transition-all duration-300 ${scrolled ? 'bg-[rgba(90,14,122,0.62)] backdrop-blur-md border-b border-white/15 py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[76px] items-center justify-between">
            <Link href="/" className="flex flex-shrink-0 items-center">
              <Image
                src="/logo-go7-purple.png"
                alt="Go Seven"
                width={210}
                height={121}
                className="h-12 w-auto sm:h-14 md:h-16"
                priority
              />
            </Link>

            <div className="hidden md:flex ml-10 items-baseline space-x-8">
              <Link href="/" className="hover:text-[#f1deff] transition-colors">Home</Link>
              <Link href="/collections" className="hover:text-[#f1deff] transition-colors">Collections</Link>
              <Link href="/collections?filter=new" className="hover:text-[#f1deff] transition-colors">New Arrivals</Link>
              <Link href="/about" className="hover:text-[#f1deff] transition-colors">Our Story</Link>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <button
                type="button"
                onClick={toggleSearch}
                aria-expanded={isSearchOpen}
                aria-label={isSearchOpen ? 'Close search' : 'Open search'}
                className="hover:text-[#f1deff] transition-colors"
              >
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

            <div className="md:hidden flex items-center space-x-4">
              <button
                type="button"
                onClick={toggleSearch}
                aria-expanded={isSearchOpen}
                aria-label={isSearchOpen ? 'Close search' : 'Open search'}
                className="hover:text-[#f1deff] transition-colors p-2"
              >
                <Search size={22} />
              </button>
              <Link href="/cart" className="relative hover:text-[#f1deff] transition-colors p-2">
                <ShoppingCart size={22} />
                {totalItems > 0 && (
                  <span className="absolute top-1 right-1 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setIsOpen((open) => !open);
                }}
                aria-expanded={isOpen}
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/20 focus:outline-none"
              >
                {isOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-white/15 bg-[rgba(90,14,122,0.88)] backdrop-blur-md"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/55" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by name, category, or description"
                    autoFocus
                    className="w-full rounded-full border border-white/20 bg-white/12 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/55 outline-none transition-colors focus:border-white/45"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-[#f1deff]"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery(currentSearch);
                      setIsSearchOpen(false);
                    }}
                    className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white/45"
                  >
                    Close
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-[rgba(90,14,122,0.88)] backdrop-blur-md border-t border-white/15 text-white"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-3 py-2 text-base font-medium hover:text-[#f1deff]"
              >
                <Home size={22} className="mr-3" /> Home
              </Link>
              <Link
                href="/collections"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-base font-medium hover:text-[#f1deff]"
              >
                Collections
              </Link>
              <Link
                href="/collections?filter=new"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-base font-medium hover:text-[#f1deff]"
              >
                New Arrivals
              </Link>
              <Link
                href="/about"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-base font-medium hover:text-[#f1deff]"
              >
                Our Story
              </Link>
            </div>
            <div className="pt-4 pb-3 border-t border-white/20">
              <div className="flex flex-wrap items-center px-5 gap-4">
                <Link
                  href={user ? '/account' : '/login'}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center text-base font-medium hover:text-[#f1deff]"
                >
                  <User size={22} className="mr-2" /> {user ? 'Account' : 'Login'}
                </Link>
                {isReady && isAdmin && (
                  <Link
                    href="/admin/products"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center text-base font-medium hover:text-[#f1deff]"
                  >
                    <ShieldCheck size={22} className="mr-2" /> Admin
                  </Link>
                )}
                <Link
                  href="/cart"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center text-base font-medium hover:text-[#f1deff]"
                >
                  <ShoppingCart size={22} className="mr-2" /> Cart {totalItems > 0 && `(${totalItems})`}
                </Link>
                {isReady && user && (
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="text-base font-medium hover:text-[#f1deff]"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
