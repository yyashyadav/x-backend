import { clearTokenCookies } from '../../../../lib/auth';

export async function POST(request) {
  try {
    
    const response = Response.json({
      success: true,
      message: 'Logout successful'
    }, { status: 200 });

    
    clearTokenCookies(response);

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}