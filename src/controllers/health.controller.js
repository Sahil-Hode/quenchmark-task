import { ApiResponse } from '../utils/ApiResponse.js';

export const getHealth = (req, res) => {
  const healthData = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    status: 'OK',
    echo: req.query.echo || null,
  };

  res.status(200).json(new ApiResponse(200, healthData, 'Server is healthy'));
};

export const testValidation = (req, res) => {
  const { title, email } = req.body;
  res.status(200).json(
    new ApiResponse(
      200,
      { title, email },
      'Data passed validation successfully'
    )
  );
};
