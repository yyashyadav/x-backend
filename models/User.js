import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  
  
  companyName: {
    type: String,
    required: true
  },
  website: {
    type: String
  },
  linkedinProfile: {
    type: String
  },
  city: {
    type: String
  },
  state: {
    type: String
  },
  country: {
    type: String
  },
  pinCode: {
    type: String,
    required: true
  },
  companyType: {
    type: String,
    enum: ['Proprietorship', 'Private Limited/LLC', 'OPC/One Person PLC', 'Partnership', 'LLP', 'Public Limited', 'Other']
  },
  yearOfRegistration: {
    type: Number
  },
  industry: {
    type: String
  },
  briefIntroduction: {
    type: String,
    maxlength: 200
  },
  

  role: {
    type: String,
    required: true,
    enum: ['pending', 'investor', 'seller', 'startup', 'consultant', 'franchise', 'impexp']
  },
  

  acquisitionCriteria: String, 
  investmentFundSize: Number,
  investmentType: {
    type: String,
    enum: ['Full Buyout', 'Partial']
  },
  locationPreferences: [String], 
  previousInvestments: Number,
  // SELLER FIELDS
  businessDescription: String,
  productsAndServices: String,
  marketAndSalesInfo: String,
  assetsIncluded: String, // "Movable & immovable assets included in sale"
  companyStructure: String,
  lastFYRevenue: Number,
  wasPatPositive: Boolean,
  currentFYProjectedRevenue: Number,
  fullTimeEmployees: Number,
  investmentRequired: Number, // Amount of investment required
  saleType: {
    type: String,
    enum: ['Full - 100%', 'Partial Sale', 'Seeking Loan']
  },
  salePercentage: Number, 
  reasonForSale: String, 
  reasonForInvestment: String, 
  
  // STARTUP FIELDS
  businessIdea: String, 
  problemSolved: String, 
  businessModel: String,
  investmentRequirement: String,
  offerToInvestor: String, 
  
  // CONSULTANT FIELDS
  servicesProvided: String,
  businessesAssisted: Number, 

  // FRANCHISE FIELDS
  franchiseeCount: {
    type: String,
    enum: ['1-3', '4-10', '11-25', '26-50', '50-100', '100+']
  },
  franchiseDescription: String,
  citiesOffered: [String], 
  minimumShopSpace: {
    value: Number,
    unit: {
      type: String,
      enum: ['Sq. ft', 'Sq. mtrs']
    },
    applicable: Boolean
  },
  minimumOpenSpace: {
    value: Number,
    unit: {
      type: String,
      enum: ['Sq. ft', 'Sq. mtrs']
    },
    applicable: Boolean
  },
  priorExperienceRequired: Boolean,
  additionalRequirements: String,
  
  // IMPEXP FIELDS
  detailedDescription: String,
  goodsExported: [{
    name: String,
    hsnCode: String
  }],
  goodsImported: [{
    name: String,
    hsnCode: String
  }],
  goodsForBuyers: [{
    name: String,
    hsnCode: String,
    postType: {
      type: String,
      enum: ['Sale', 'RFP']
    }
  }],
  goodsForSuppliers: [{
    name: String,
    hsnCode: String,
    postType: {
      type: String,
      enum: ['RFQ']
    }
  }],
  iecNumber: String, 

  // Common fields for all
  gstOrCin: {
    type: String,
    required: true
  },
  documents: [String], 
  
  connections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Registration steps completion
  step1Completed: {
    type: Boolean,
    default: false
  },
  step2Completed: {
    type: Boolean,
    default: false
  },
  step3Completed: {
    type: Boolean,
    default: false
  },
  step4Completed: {
    type: Boolean,
    default: false
  },
  
  // Account status
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ industry: 1 });
userSchema.index({ city: 1, state: 1, country: 1 });
userSchema.index({ step1Completed: 1, step2Completed: 1, step3Completed: 1, step4Completed: 1 });

export default mongoose.models.User || mongoose.model('User', userSchema);