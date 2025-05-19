import { Link } from "wouter";
import { Rows3 } from "lucide-react";
import { FaTwitter, FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="text-xl font-bold flex items-center mb-4">
              <Rows3 className="mr-2 h-6 w-6" />
              <span>Hive-Now</span>
            </div>
            <p className="text-gray-400 mb-4">Professional project completion services for businesses and individuals.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition duration-150">
                <FaTwitter className="text-xl" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition duration-150">
                <FaFacebook className="text-xl" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition duration-150">
                <FaInstagram className="text-xl" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition duration-150">
                <FaLinkedin className="text-xl" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Services</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-150">Web Development</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-150">Digital Marketing</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-150">Content Creation</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-150">Graphic Design</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-150">App Development</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-150">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-150">Careers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-150">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-150">Press</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-150">Partners</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-150">Help Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-150">Contact Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-150">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-150">Terms of Service</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-150">FAQs</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Hive-Now. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
