import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Search, Menu, X } from 'lucide-react';
import { ThemeToggle } from './components/theme-toggle';
import { useState } from 'react';

export default function Layout() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search-results?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const navItems = [
    { path: '/', label: '首页' },
    { path: '/api-browser', label: 'API浏览器' },
    { path: '/guide', label: '使用指南' },
  ];

  return (
    <ThemeProvider defaultTheme="dark" storageKey="unreal-sdk-theme">
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-2">
                <div className="rounded-md bg-primary p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
                    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
                    <path d="M7 7h.01"></path>
                  </svg>
                </div>
                <span className="font-bold text-xl">Unreal SDK 浏览器</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === item.path ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="搜索API..."
                  className="w-[200px] pl-8 md:w-[300px] rounded-md"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              <ThemeToggle />
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border/40 py-4">
              <div className="container flex flex-col gap-4">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="搜索API..."
                    className="w-full pl-8 rounded-md"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
                <nav className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-2 py-1 rounded-md text-sm font-medium transition-colors hover:bg-accent ${
                        location.pathname === item.path ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="flex justify-end pt-2">
                    <ThemeToggle />
                  </div>
                </nav>
              </div>
            </div>
          )}
        </header>

        <main className="flex-1">
          <Outlet />
        </main>

        <footer className="border-t border-border/40 bg-background py-6">
          <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Unreal SDK 浏览器 | 非官方文档工具
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary">关于</a>
              <a href="#" className="hover:text-primary">隐私政策</a>
              <a href="#" className="hover:text-primary">反馈</a>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}