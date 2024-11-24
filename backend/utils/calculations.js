// Constants for fee calculation
const FEE_PER_SIX_SECONDS = 0.01; // Rs. 0.01 per 6 seconds
const SECONDS_PER_UNIT = 6; // Number of seconds per billing unit
const MINIMUM_FEE = 0.01; // Minimum fee of Rs. 0.01
const MAXIMUM_SESSION_MINUTES = 60; // Maximum session duration in minutes
const MAXIMUM_SESSION_SECONDS = MAXIMUM_SESSION_MINUTES * 60; // Maximum session duration in seconds

/**
 * Calculates the precise duration between two timestamps in seconds
 * @param {Date} startTime - Session start timestamp
 * @param {Date} endTime - Session end timestamp
 * @returns {number} Duration in seconds (rounded to nearest second)
 */
export const calculateDurationInSeconds = (startTime, endTime) => {
  const durationMs = endTime - startTime;
  const durationSeconds = Math.floor(durationMs / 1000);
  return Math.min(durationSeconds, MAXIMUM_SESSION_SECONDS);
};

/**
 * Calculates the duration in minutes (for display purposes)
 * @param {Date} startTime - Session start timestamp
 * @param {Date} endTime - Session end timestamp
 * @returns {number} Duration in minutes (rounded to 2 decimal places)
 */
export const calculateDuration = (startTime, endTime) => {
  const durationSeconds = calculateDurationInSeconds(startTime, endTime);
  return roundToTwoDecimals(durationSeconds / 60);
};

/**
 * Calculates the usage fee based on duration in seconds
 * @param {Date} startTime - Session start timestamp
 * @param {Date} endTime - Session end timestamp
 * @returns {number} Usage fee in rupees (rounded to 2 decimal places)
 */
export const calculateUsageFee = (startTime, endTime) => {
  const durationSeconds = calculateDurationInSeconds(startTime, endTime);
  const billingUnits = Math.ceil(durationSeconds / SECONDS_PER_UNIT);
  const fee = Math.max(billingUnits * FEE_PER_SIX_SECONDS, MINIMUM_FEE);
  return roundToTwoDecimals(fee);
};

/**
 * Rounds a number to two decimal places
 * @param {number} number - Number to round
 * @returns {number} Rounded number
 */
export const roundToTwoDecimals = (number) => {
  return parseFloat((Math.round(number * 100) / 100).toFixed(2));
};