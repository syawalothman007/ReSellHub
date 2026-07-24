export const getOtherParticipantUid = (participants, currentUserUid) =>
  participants?.find((participantUid) => participantUid !== currentUserUid) || null;

export const normalizeUserProfile = (profileData = {}, fallbackName = "User") => ({
  ...profileData,
  displayName:
    profileData.fullName ||
    profileData.displayName ||
    profileData.name ||
    profileData.email?.split("@")[0] ||
    fallbackName,
  avatarUrl:
    profileData.profileImageUrl ||
    profileData.profileImage ||
    profileData.photoURL ||
    profileData.avatarUrl ||
    "",
});
