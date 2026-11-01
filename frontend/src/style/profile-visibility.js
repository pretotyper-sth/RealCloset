export function visibleItems(items, item, published) {
  const rest = items.filter(x => x.id !== item.id);
  return published ? [...rest, { ...item, public: true }] : rest;
}

export async function persistVisibility(item, published, { updateWardrobe, updateProfile }) {
  let wardrobeAttempted = false, profileAttempted = false;
  try {
    if (updateWardrobe) {
      wardrobeAttempted = true;
      await updateWardrobe(item, published);
    }
    profileAttempted = true;
    await updateProfile(item, published);
  } catch (error) {
    const rollback = await Promise.allSettled([
      ...(wardrobeAttempted ? [updateWardrobe(item, !published)] : []),
      ...(profileAttempted ? [updateProfile(item, !published)] : []),
    ]);
    if (rollback.some(result => result.status === 'rejected')) {
      throw new Error('공개 상태를 확인하지 못했어요. 새로고침 후 다시 시도해 주세요.');
    }
    throw error;
  }
}
