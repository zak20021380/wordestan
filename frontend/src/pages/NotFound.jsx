import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Gamepad2 } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        {/* 404 Display */}
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-white mb-4">404</h1>
          <p className="text-2xl text-white/80 mb-2">Page Not Found</p>
          <p className="text-white/60 max-w-md mx-auto">
            The page you're looking for doesn't exist. Maybe you took a wrong turn in the word maze?
          </p>
        </div>

        {/* Game Character */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mb-4">
            <Gamepad2 className="w-16 h-16 text-white" />
          </div>
          <p className="text-white/60 italic">
            "Don't worry, even the best wordsmiths get lost sometimes!"
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Home className="w-5 h-5" />
            <span>Go Home</span>
          </Link>
          
          <Link
            to="/game"
            className="bg-glass hover:bg-glass-hover text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 border border-glass-border"
          >
            <Gamepad2 className="w-5 h-5" />
            <span>Play Game</span>
          </Link>
        </div>

        {/* Fun Facts */}
        <div className="mt-12">
          <h3 className="text-lg font-semibold text-white mb-4">Did You Know?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="bg-glass backdrop-blur-lg rounded-lg border border-glass-border p-4">
              <p className="text-white/80 text-sm">
                The longest word in English has 189,819 letters and would take 3.5 hours to pronounce!
              </p>
            </div>
            <div className="bg-glass backdrop-blur-lg rounded-lg border border-glass-border p-4">
              <p className="text-white/80 text-sm">
                "I am" is the shortest complete sentence in the English language.
              </p>
            </div>
            <div className="bg-glass backdrop-blur-lg rounded-lg border border-glass-border p-4">
              <p className="text-white/80 text-sm">
                The word "set" has the most definitions in the dictionary with 430 different meanings!
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;