import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function About() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const portfolioImages = [
    { id: 1, title: "Classic Red", description: "Elegant red nail design" },
    { id: 2, title: "Glitter Gold", description: "Sparkling gold accent nails" },
    { id: 3, title: "French Manicure", description: "Timeless French manicure" },
    { id: 4, title: "Ombre Pink", description: "Beautiful pink ombre effect" },
    { id: 5, title: "Floral Design", description: "Delicate floral nail art" },
    { id: 6, title: "Geometric Pattern", description: "Modern geometric design" },
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % portfolioImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + portfolioImages.length) % portfolioImages.length);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">About Us</h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* About Section */}
        <Card className="p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Welcome to Nail'd by Steph</h2>
          <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
            <p>
              Hi! I'm Steph, a passionate nail technician dedicated to providing you with beautiful, 
              professional nail care services. With years of experience in the beauty industry, I take pride 
              in creating custom designs that reflect your unique style and personality.
            </p>
            <p>
              Whether you're looking for a classic manicure, trendy nail art, or special occasion designs, 
              I'm here to make your nails look absolutely stunning. Every client is treated with care and 
              attention to detail, ensuring you leave feeling confident and beautiful.
            </p>
            <p>
              I use only high-quality products and maintain strict hygiene standards to ensure your safety 
              and satisfaction. Let's create something beautiful together!
            </p>
          </div>
        </Card>

        {/* Portfolio Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Portfolio</h2>
          
          {/* Image Carousel */}
          <Card className="p-8 mb-8">
            <div className="relative">
              {/* Main Image */}
              <div className="bg-gradient-to-br from-pink-300 to-orange-300 rounded-lg h-96 flex items-center justify-center mb-6">
                <div className="text-center text-white">
                  <p className="text-2xl font-bold">{portfolioImages[currentImageIndex].title}</p>
                  <p className="text-sm mt-2">{portfolioImages[currentImageIndex].description}</p>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center">
                <button
                  onClick={prevImage}
                  className="p-2 rounded-full bg-pink-600 text-white hover:bg-pink-700 transition"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                
                <div className="flex-1 flex justify-center gap-2 mx-4">
                  {portfolioImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition ${
                        index === currentImageIndex ? "bg-pink-600" : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={nextImage}
                  className="p-2 rounded-full bg-pink-600 text-white hover:bg-pink-700 transition"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Image Counter */}
              <div className="text-center mt-4 text-gray-600">
                {currentImageIndex + 1} / {portfolioImages.length}
              </div>
            </div>
          </Card>

          {/* Portfolio Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {portfolioImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setCurrentImageIndex(index)}
                className={`rounded-lg overflow-hidden transition transform hover:scale-105 ${
                  index === currentImageIndex ? "ring-4 ring-pink-600" : ""
                }`}
              >
                <div className="bg-gradient-to-br from-pink-300 to-orange-300 h-32 flex items-center justify-center">
                  <div className="text-center text-white">
                    <p className="font-semibold">{image.title}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="p-8 bg-gradient-to-r from-pink-50 to-orange-50 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to get your nails done?</h3>
          <p className="text-gray-700 mb-6">
            Book your appointment today and let me create something beautiful for you!
          </p>
          <Link href="/book">
            <Button className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3">
              Book Now
            </Button>
          </Link>
        </Card>
      </main>
    </div>
  );
}
