// AI/ML-driven user similarity scoring algorithm
// Uses multiple factors: interests, skills, activities, academic data

/**
 * Calculate cosine similarity between two vectors
 * @param {Array} vecA - First vector
 * @param {Array} vecB - Second vector
 * @returns {number} - Similarity score between 0 and 1
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (normA * normB);
}

/**
 * Calculate Jaccard similarity between two sets
 * @param {Array} setA - First set
 * @param {Array} setB - Second set
 * @returns {number} - Similarity score between 0 and 1
 */
function jaccardSimilarity(setA, setB) {
  if (!setA || !setB || (setA.length === 0 && setB.length === 0)) return 0;
  
  const a = new Set(setA.map(item => String(item).toLowerCase().trim()));
  const b = new Set(setB.map(item => String(item).toLowerCase().trim()));
  
  const intersection = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  
  if (union.size === 0) return 0;
  
  return intersection.size / union.size;
}

/**
 * Extract features from user profile for ML scoring
 * @param {Object} user - User object
 * @returns {Object} - Feature vectors and sets
 */
function extractFeatures(user) {
  return {
    interests: Array.isArray(user.interests) ? user.interests : [],
    hobbies: Array.isArray(user.hobbies) ? user.hobbies : [],
    skills: Array.isArray(user.skills) ? user.skills : [],
    favoriteSubjects: Array.isArray(user.favoriteSubjects) ? user.favoriteSubjects : [],
    sports: Array.isArray(user.sports) ? user.sports : [],
    major: user.major ? [user.major] : [],
    location: user.location ? [user.location] : [],
    // Entertainment preferences (from signup form)
    musicGenres: Array.isArray(user.musicGenres) ? user.musicGenres : [],
    movieGenres: Array.isArray(user.movieGenres) ? user.movieGenres : [],
    // Entertainment preferences (from profile page)
    favoriteMovies: Array.isArray(user.favoriteMovies) ? user.favoriteMovies : [],
    favoriteShows: Array.isArray(user.favoriteShows) ? user.favoriteShows : [],
    favoriteBooks: Array.isArray(user.favoriteBooks) ? user.favoriteBooks : [],
    favoriteMusic: Array.isArray(user.favoriteMusic) ? user.favoriteMusic : [],
    favoriteGames: Array.isArray(user.favoriteGames) ? user.favoriteGames : []
  };
}

/**
 * Calculate comprehensive similarity score between two users
 * @param {Object} user1 - First user object
 * @param {Object} user2 - Second user object
 * @param {Array} user1Activities - User 1's activities
 * @param {Array} user2Activities - User 2's activities
 * @returns {number} - Overall similarity score between 0 and 100
 */
function calculateSimilarityScore(user1, user2, user1Activities = [], user2Activities = []) {
  const features1 = extractFeatures(user1);
  const features2 = extractFeatures(user2);
  
  // Weight configuration (must sum to 1.0)
  const weights = {
    academic: 0.25,      // Major, subjects, skills
    interests: 0.20,     // General interests and hobbies
    activities: 0.15,    // Shared activity participation
    entertainment: 0.15, // Movies, shows, books, music, games
    sports: 0.10,        // Sports and physical activities
    location: 0.10,      // Geographic proximity
    social: 0.05         // Social engagement patterns
  };
  
  // 1. Academic Similarity
  const academicScore = (
    jaccardSimilarity(features1.major, features2.major) * 0.4 +
    jaccardSimilarity(features1.favoriteSubjects, features2.favoriteSubjects) * 0.35 +
    jaccardSimilarity(features1.skills, features2.skills) * 0.25
  );
  
  // 2. Interests Similarity
  const interestsScore = (
    jaccardSimilarity(features1.interests, features2.interests) * 0.6 +
    jaccardSimilarity(features1.hobbies, features2.hobbies) * 0.4
  );
  
  // 3. Activities Similarity
  let activitiesScore = 0;
  if (user1Activities.length > 0 || user2Activities.length > 0) {
    const user1ActivityTypes = user1Activities.map(a => a.category || a.type);
    const user2ActivityTypes = user2Activities.map(a => a.category || a.type);
    activitiesScore = jaccardSimilarity(user1ActivityTypes, user2ActivityTypes);
  }
  
  // 4. Entertainment Similarity (combines both signup and profile preferences)
  const entertainmentScore = (
    jaccardSimilarity(features1.movieGenres, features2.movieGenres) * 0.15 +
    jaccardSimilarity(features1.musicGenres, features2.musicGenres) * 0.15 +
    jaccardSimilarity(features1.favoriteMovies, features2.favoriteMovies) * 0.20 +
    jaccardSimilarity(features1.favoriteShows, features2.favoriteShows) * 0.20 +
    jaccardSimilarity(features1.favoriteBooks, features2.favoriteBooks) * 0.15 +
    jaccardSimilarity(features1.favoriteMusic, features2.favoriteMusic) * 0.075 +
    jaccardSimilarity(features1.favoriteGames, features2.favoriteGames) * 0.075
  );
  
  // 5. Sports Similarity
  const sportsScore = jaccardSimilarity(features1.sports, features2.sports);
  
  // 6. Location Similarity
  const locationScore = jaccardSimilarity(features1.location, features2.location);
  
  // 7. Social Engagement (activity participation rate)
  const user1Engagement = user1Activities.length;
  const user2Engagement = user2Activities.length;
  const avgEngagement = (user1Engagement + user2Engagement) / 2;
  const socialScore = avgEngagement > 0 ? Math.min(
    Math.abs(user1Engagement - user2Engagement) / avgEngagement,
    1.0
  ) : 0;
  
  // Calculate weighted overall score
  const overallScore = (
    academicScore * weights.academic +
    interestsScore * weights.interests +
    activitiesScore * weights.activities +
    entertainmentScore * weights.entertainment +
    sportsScore * weights.sports +
    locationScore * weights.location +
    (1 - socialScore) * weights.social // Invert social score (closer engagement = better)
  );
  
  // Convert to 0-100 scale and round
  return Math.round(overallScore * 100);
}

/**
 * Calculate detailed similarity breakdown for transparency
 * @param {Object} user1 - First user object
 * @param {Object} user2 - Second user object
 * @param {Array} user1Activities - User 1's activities
 * @param {Array} user2Activities - User 2's activities
 * @returns {Object} - Detailed breakdown of similarity scores
 */
function calculateDetailedSimilarity(user1, user2, user1Activities = [], user2Activities = []) {
  const features1 = extractFeatures(user1);
  const features2 = extractFeatures(user2);
  
  return {
    overall: calculateSimilarityScore(user1, user2, user1Activities, user2Activities),
    breakdown: {
      academic: Math.round(
        (jaccardSimilarity(features1.major, features2.major) * 0.4 +
        jaccardSimilarity(features1.favoriteSubjects, features2.favoriteSubjects) * 0.35 +
        jaccardSimilarity(features1.skills, features2.skills) * 0.25) * 100
      ),
      interests: Math.round(
        (jaccardSimilarity(features1.interests, features2.interests) * 0.6 +
        jaccardSimilarity(features1.hobbies, features2.hobbies) * 0.4) * 100
      ),
      activities: Math.round(
        jaccardSimilarity(
          user1Activities.map(a => a.category || a.type),
          user2Activities.map(a => a.category || a.type)
        ) * 100
      ),
      entertainment: Math.round(
        (jaccardSimilarity(features1.movieGenres, features2.movieGenres) * 0.15 +
        jaccardSimilarity(features1.musicGenres, features2.musicGenres) * 0.15 +
        jaccardSimilarity(features1.favoriteMovies, features2.favoriteMovies) * 0.20 +
        jaccardSimilarity(features1.favoriteShows, features2.favoriteShows) * 0.20 +
        jaccardSimilarity(features1.favoriteBooks, features2.favoriteBooks) * 0.15 +
        jaccardSimilarity(features1.favoriteMusic, features2.favoriteMusic) * 0.075 +
        jaccardSimilarity(features1.favoriteGames, features2.favoriteGames) * 0.075) * 100
      ),
      sports: Math.round(jaccardSimilarity(features1.sports, features2.sports) * 100),
      location: Math.round(jaccardSimilarity(features1.location, features2.location) * 100)
    },
    commonalities: {
      interests: [...new Set([...features1.interests, ...features2.interests])].filter(
        i => features1.interests.includes(i) && features2.interests.includes(i)
      ),
      subjects: [...new Set([...features1.favoriteSubjects, ...features2.favoriteSubjects])].filter(
        s => features1.favoriteSubjects.includes(s) && features2.favoriteSubjects.includes(s)
      ),
      activities: [...new Set([
        ...user1Activities.map(a => a.category || a.type),
        ...user2Activities.map(a => a.category || a.type)
      ])].filter(
        type => 
          user1Activities.some(a => (a.category || a.type) === type) &&
          user2Activities.some(a => (a.category || a.type) === type)
      )
    }
  };
}

module.exports = {
  calculateSimilarityScore,
  calculateDetailedSimilarity,
  jaccardSimilarity,
  cosineSimilarity
};
