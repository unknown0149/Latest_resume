import React from 'react';
import { User } from 'lucide-react';

/**
 * Avatar Component
 * Displays user avatar with automatic initials fallback and gradient colors
 * 
 * Props:
 * - src: Image URL
 * - name: User's name (for initials)
 * - size: 'sm' | 'md' | 'lg' | 'xl' | 'custom'
 * - className: Additional CSS classes
 * - onClick: Click handler
 */

const getInitials = (name) => {
  if (!name) return '?';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getGradientFromName = (name) => {
  if (!name) return 'from-gray-400 to-gray-600';
  
  const gradients = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-pink-600',
    'from-green-400 to-green-600',
    'from-yellow-400 to-yellow-600',
    'from-red-400 to-red-600',
    'from-indigo-400 to-indigo-600',
    'from-teal-400 to-teal-600',
    'from-orange-400 to-orange-600',
    'from-cyan-400 to-cyan-600'
  ];
  
  // Use first letter to determine gradient (consistent for same name)
  const charCode = name.charCodeAt(0);
  const index = charCode % gradients.length;
  
  return gradients[index];
};

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
  '2xl': 'w-32 h-32 text-3xl'
};

const Avatar = ({ 
  src, 
  name, 
  size = 'md', 
  className = '', 
  onClick,
  showHoverEffect = true 
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(!!src);
  
  const initials = getInitials(name);
  const gradient = getGradientFromName(name);
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  
  const handleImageLoad = () => {
    setIsLoading(false);
  };
  
  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };
  
  const containerClasses = `
    ${sizeClass}
    rounded-full
    flex
    items-center
    justify-center
    font-semibold
    overflow-hidden
    relative
    ${onClick ? 'cursor-pointer' : ''}
    ${showHoverEffect && onClick ? 'transform transition-all duration-200 hover:scale-110 hover:shadow-lg' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');
  
  return (
    <div 
      className={containerClasses} 
      onClick={onClick}
      title={name || 'User'}
    >
      {src && !imageError ? (
        <>
          {isLoading && (
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} animate-pulse`} />
          )}
          <img
            src={src}
            alt={name || 'User avatar'}
            className="w-full h-full object-cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </>
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}>
          {name ? (
            <span className="select-none">{initials}</span>
          ) : (
            <User className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : size === 'xl' ? 'w-12 h-12' : 'w-6 h-6'} />
          )}
        </div>
      )}
    </div>
  );
};

/**
 * AvatarGroup Component
 * Displays multiple avatars stacked horizontally
 */
export const AvatarGroup = ({ users = [], maxDisplay = 3, size = 'sm', className = '' }) => {
  const displayUsers = users.slice(0, maxDisplay);
  const remainingCount = users.length - maxDisplay;
  
  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex -space-x-2">
        {displayUsers.map((user, index) => (
          <div key={index} className="relative ring-2 ring-white rounded-full">
            <Avatar
              src={user.avatar_url}
              name={user.name}
              size={size}
              showHoverEffect={false}
            />
          </div>
        ))}
        {remainingCount > 0 && (
          <div 
            className={`
              ${sizeClasses[size]}
              rounded-full
              bg-gray-200
              flex
              items-center
              justify-center
              text-gray-600
              text-xs
              font-medium
              ring-2
              ring-white
            `}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * AvatarUpload Component
 * Avatar with upload functionality
 */
export const AvatarUpload = ({ 
  src, 
  name, 
  size = 'xl', 
  onUpload, 
  className = '' 
}) => {
  const fileInputRef = React.useRef(null);
  const [preview, setPreview] = React.useState(src);
  const [isUploading, setIsUploading] = React.useState(false);
  
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    // Call upload handler
    if (onUpload) {
      setIsUploading(true);
      try {
        await onUpload(file);
      } catch (error) {
        console.error('Upload failed:', error);
        setPreview(src); // Revert on error
      } finally {
        setIsUploading(false);
      }
    }
  };
  
  return (
    <div className={`relative inline-block ${className}`}>
      <Avatar
        src={preview}
        name={name}
        size={size}
        onClick={() => fileInputRef.current?.click()}
        showHoverEffect={!isUploading}
      />
      
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`
          absolute
          bottom-0
          right-0
          ${size === 'xl' || size === '2xl' ? 'w-8 h-8' : 'w-6 h-6'}
          bg-blue-600
          hover:bg-blue-700
          text-white
          rounded-full
          flex
          items-center
          justify-center
          shadow-lg
          transition-all
          ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title="Upload photo"
      >
        {isUploading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading}
      />
    </div>
  );
};

export default Avatar;
