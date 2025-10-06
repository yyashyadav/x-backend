'use client';
import { useState } from 'react';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const loginData = {
      email: formData.get('email'),
      password: formData.get('password')
    };

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data);
        alert('Login successful!');
      } else {
        alert('Login failed: ' + data.message);
      }
    } catch (error) {
      alert('Login error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const registerData = {
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role'),
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName')
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data);
        alert('Registration successful!');
      } else {
        alert('Registration failed: ' + data.message);
      }
    } catch (error) {
      alert('Registration error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setUser(null);
        alert('Logout successful!');
      }
    } catch (error) {
      alert('Logout error: ' + error.message);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            B2B Matchmaking Platform
          </h1>
          <p className="text-gray-600 mb-8">
            Connect businesses for investment, acquisition, and growth opportunities
          </p>
        </div>

        {user ? (
          // User Dashboard
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Welcome, {user.firstName}!</h2>
              <p className="text-gray-600">Role: {user.role}</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900">Profile Status</h3>
                <p className="text-blue-700">
                  {user.profileCompleted ? '✅ Profile Completed' : '❌ Profile Incomplete'}
                </p>
                <p className="text-blue-700">
                  {user.isVerified ? '✅ Email Verified' : '❌ Email Not Verified'}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          // Login/Register Forms
          <div className="bg-white shadow rounded-lg p-6">
            <div className="space-y-6">
              {/* Login Form */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Login</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="login-email"
                      name="email"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      type="password"
                      id="login-password"
                      name="password"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </form>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Register</h2>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="register-email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="register-email"
                      name="email"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="register-password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      type="password"
                      id="register-password"
                      name="password"
                      required
                      minLength="8"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select your role</option>
                      <option value="investor">Investor & Buyer</option>
                      <option value="seller">Business Seller</option>
                      <option value="startup">Startup</option>
                      <option value="consultant">Consultant & Advisor</option>
                      <option value="franchise">Franchisor</option>
                      <option value="impexp">Import & Export</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Registering...' : 'Register'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
