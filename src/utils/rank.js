const RANKS = {
    ROOKIE: 'Rookie',
    BEGINNER: 'Beginner',
    INTERMEDIATE: 'Intermediate',
    EXPERT: 'Expert',
    MASTER: 'Master',
};

function getRank(score) {
    if (score <= 100) {
        return RANKS.ROOKIE;
    } else if (score <= 200) {
        return RANKS.BEGINNER;
    } else if (score <= 300) {
        return RANKS.INTERMEDIATE;
    } else if (score <= 400) {
        return RANKS.EXPERT;
    } else {
        return RANKS.MASTER;
    }
}

module.exports = {
    getRank,
    RANKS,
};
