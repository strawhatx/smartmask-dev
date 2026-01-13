'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [hoveredImage, setHoveredImage] = useState<number | null>(null);

  // Local images from assets folder
  const imageColumns = [
    // Column 1 - translateY(-16.3656px)
    [
      '/assets/sneakers-product.jpg',
      '/assets/nike-product.jpg',
      '/assets/guy-person-2.jpg',
      
    ],
    // Column 2 - translateY(16.3656px) - middle column lower
    [
      '/assets/headphones-product.jpg',
      '/assets/olis-product.jpg',
      '/assets/city-place.jpg',
    ],
    // Column 3 - translateY(-16.3656px)
    [
      '/assets/girl-person.jpg',
      '/assets/watch-product.jpg',
      '/assets/guy-person.jpg',
    ],
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="text-xl font-semibold text-black underline decoration-gray-300">
          SmartMask
        </div>
        <nav className="flex items-center gap-6">
          <a href="#" className="text-black hover:text-gray-600">
            Pricing
          </a>
          <a
            href="#"
            className="text-black hover:text-gray-600"
            aria-label="Twitter"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
            </svg>
          </a>
          <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            Sign In
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6 leading-tight">
            Auto Remove{' '}
            <span className="text-blue-400 underline decoration-blue-400">
              background from
            </span>{' '}
            your images.
          </h1>
          <p className="text-md text-gray-600 mb-8 max-w-2xl mx-auto">
            Create professional product photos, social media content, and
            transparent PNGs that actually convert.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/editor" className="bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
              Try Now
            </Link>
            <button className="bg-white text-black border-2 border-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              Demo
            </button>
          </div>
        </div>
      </section>

      {/* Example Images Grid - 3 columns, 3 rows with middle column offset */}
      <section className="max-w-5xl mx-auto px-2 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start gap-10">
          {imageColumns.map((column, colIndex) => {
            const isMiddleColumn = colIndex === 1;
            const baseTranslateY = isMiddleColumn ? 16.3656 : -16.3656;

            return (
              <div key={colIndex} className="grid gap-10">
                {column.map((imageUrl, imgIndex) => {
                  const imageId = colIndex * 3 + imgIndex + 1;
                  const isHovered = hoveredImage === imageId;
                  const translateY = isHovered
                    ? baseTranslateY * 1.1
                    : baseTranslateY;
                  const scale = isHovered && colIndex === 0 ? 1.02 : 1;

                  return (
                    <div
                      key={imgIndex}
                      className="cursor-pointer transition-transform duration-300"
                      style={{
                        transform: `translateY(${translateY}px) scale(${scale})`,
                      }}
                      onMouseEnter={() => setHoveredImage(imageId)}
                      onMouseLeave={() => setHoveredImage(null)}
                    >
                      <Image
                        alt="thumbnail"
                        src={imageUrl}
                        width={400}
                        height={400}
                        className="h-auto w-full object-cover rounded-lg"
                        loading="lazy"
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
            One tool, endless uses
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Edit your photos' backgrounds to white for flawless{' '}
            <strong>e-commerce shots</strong>, <strong>car listings</strong>, or
            professional <strong>headshots</strong>. Create a{' '}
            <strong>transparent background (PNG)</strong> to design the perfect{' '}
            <strong>logo</strong> or <strong>graphic</strong> for any project or
            presentation. Whatever your need, SmartMask saves you time and helps
            you deliver professional results in seconds.
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            'for Individuals',
            'for Photographers',
            'for Marketing',
            'for Developers',
            'for Ecommerce',
            'for Media',
            'for Car Dealerships',
          ].map((useCase) => (
            <div
              key={useCase}
              className="bg-gray-100 hover:bg-gray-200 rounded-lg p-6 text-center cursor-pointer transition-colors"
            >
              <p className="text-gray-900 font-medium">{useCase}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SmartMask Features Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-black text-center mb-12">
            Powered by SmartMask
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Precision Feature */}
            <div className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-black mb-3">
                    Precision
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    Advanced mask technology for perfect edge detection, even
                    with similar colors
                  </p>
                </div>
              </div>
            </div>

            {/* Smart Refinement Feature */}
            <div className="group relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100 hover:border-purple-300 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-black mb-3">
                    Smart Refinement
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    Manual brush tools with Similar Color Mode for perfect
                    control over your results
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

