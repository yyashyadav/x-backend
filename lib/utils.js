import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Password utilities
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

// JWT utilities
export function generateToken(payload, secret, expiresIn) {
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token, secret) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

// Validation utilities
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
    errors: {
      minLength: password.length < minLength,
      noUpperCase: !hasUpperCase,
      noLowerCase: !hasLowerCase,
      noNumbers: !hasNumbers,
      noSpecialChar: !hasSpecialChar
    }
  };
}

export function validatePhoneNumber(phone) {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone);
}

// Response utilities
export function successResponse(data, message = 'Success', statusCode = 200) {
  return {
    success: true,
    message,
    data,
    statusCode
  };
}

export function errorResponse(message = 'Error', statusCode = 500, errors = null) {
  return {
    success: false,
    message,
    errors,
    statusCode
  };
}

// Pagination utilities
export function paginateResults(results, page = 1, limit = 20) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedResults = results.slice(startIndex, endIndex);
  
  return {
    data: paginatedResults,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(results.length / limit),
      totalResults: results.length,
      hasNext: endIndex < results.length,
      hasPrev: page > 1
    }
  };
}

// Search utilities
export function createSearchQuery(searchTerm, searchFields) {
  if (!searchTerm) return {};
  
  const searchRegex = new RegExp(searchTerm, 'i');
  return {
    $or: searchFields.map(field => ({
      [field]: searchRegex
    }))
  };
}

// Role-specific field utilities
export function getRoleSpecificFields(user, role) {
  const roleFields = {
    investor: {
      acquisitionCriteria: user.acquisitionCriteria,
      investmentFundSize: user.investmentFundSize,
      investmentType: user.investmentType,
      locationPreferences: user.locationPreferences,
      previousInvestments: user.previousInvestments
    },
    seller: {
      businessDescription: user.businessDescription,
      productsAndServices: user.productsAndServices,
      marketAndSalesInfo: user.marketAndSalesInfo,
      assetsIncluded: user.assetsIncluded,
      companyStructure: user.companyStructure,
      lastFYRevenue: user.lastFYRevenue,
      wasPatPositive: user.wasPatPositive,
      currentFYProjectedRevenue: user.currentFYProjectedRevenue,
      fullTimeEmployees: user.fullTimeEmployees,
      investmentRequired: user.investmentRequired,
      saleType: user.saleType,
      salePercentage: user.salePercentage,
      reasonForSale: user.reasonForSale,
      reasonForInvestment: user.reasonForInvestment
    },
    startup: {
      businessIdea: user.businessIdea,
      problemSolved: user.problemSolved,
      businessModel: user.businessModel,
      investmentRequirement: user.investmentRequirement,
      offerToInvestor: user.offerToInvestor
    },
    consultant: {
      servicesProvided: user.servicesProvided,
      businessesAssisted: user.businessesAssisted
    },
    franchise: {
      franchiseeCount: user.franchiseeCount,
      franchiseDescription: user.franchiseDescription,
      citiesOffered: user.citiesOffered,
      minimumShopSpace: user.minimumShopSpace,
      minimumOpenSpace: user.minimumOpenSpace,
      priorExperienceRequired: user.priorExperienceRequired,
      additionalRequirements: user.additionalRequirements
    },
    impexp: {
      detailedDescription: user.detailedDescription,
      goodsExported: user.goodsExported,
      goodsImported: user.goodsImported,
      goodsForBuyers: user.goodsForBuyers,
      goodsForSuppliers: user.goodsForSuppliers,
      iecNumber: user.iecNumber
    }
  };

  return roleFields[role] || {};
}

// Date utilities
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function getRelativeTime(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(date);
}

// File utilities
export function validateFileType(fileName, allowedTypes) {
  const extension = fileName.split('.').pop().toLowerCase();
  return allowedTypes.includes(extension);
}

export function getFileSizeInMB(fileSize) {
  return (fileSize / (1024 * 1024)).toFixed(2);
}

// Sanitization utilities
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') 
    .replace(/javascript:/gi, '') 
    .replace(/on\w+=/gi, ''); 
}

export function sanitizeObject(obj) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
