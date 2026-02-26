// Characters used for room codes (excluding ambiguous chars like 0/O, 1/I/L)
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Generate a random room code
 * @param {number} length - Length of the code (default 6)
 * @returns {string} - Random room code
 */
export const generateRoomCode = (length = 6) => {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
};

/**
 * Validate a room code format
 * @param {string} code - Room code to validate
 * @returns {boolean} - True if valid format
 */
export const isValidRoomCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  const upperCode = code.toUpperCase();
  if (upperCode.length !== 6) return false;
  return [...upperCode].every((char) => CHARS.includes(char));
};

/**
 * Normalize a room code (uppercase, trim)
 * @param {string} code - Room code to normalize
 * @returns {string} - Normalized code
 */
export const normalizeRoomCode = (code) => {
  if (!code) return '';
  return code.toUpperCase().trim();
};
