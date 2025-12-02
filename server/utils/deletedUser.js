const DEFAULT_DELETED_AVATAR = 'https://ui-avatars.com/api/?name=Deleted+User&background=1F2937&color=fff&bold=true';
const DEFAULT_DELETED_NAME = 'Deleted user';

const normalizeDoc = (doc) => {
  if (!doc) return null;
  if (typeof doc.toObject === 'function') {
    return doc.toObject({ virtuals: true });
  }
  return doc;
};

const asDeletedUser = (id = null) => ({
  _id: id,
  id,
  username: DEFAULT_DELETED_NAME,
  profilePicture: DEFAULT_DELETED_AVATAR,
  isDeleted: true
});

const scrubUserForPublic = (doc) => {
  const normalized = normalizeDoc(doc);
  if (!normalized) {
    return asDeletedUser(null);
  }

  if (typeof normalized !== 'object') {
    const id = typeof normalized === 'string' ? normalized : normalized?.toString?.();
    return asDeletedUser(id || null);
  }

  if (!normalized.isDeleted) {
    return normalized;
  }

  return {
    ...normalized,
    username: DEFAULT_DELETED_NAME,
    profilePicture: normalized.profilePicture || DEFAULT_DELETED_AVATAR,
    isDeleted: true
  };
};

module.exports = {
  scrubUserForPublic,
  asDeletedUser,
  DEFAULT_DELETED_AVATAR,
  DEFAULT_DELETED_NAME
};
