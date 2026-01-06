import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { firebaseDb } from '@/services/firebase/firebaseClient';
import type { UserProfile } from '@/types/user';

const usersCollection = collection(firebaseDb, 'users');

export async function upsertUserProfile(profile: UserProfile): Promise<void> {
  const ref = doc(usersCollection, profile.id);
  await setDoc(ref, profile, { merge: true });
}

export async function getUserProfileById(userId: string): Promise<UserProfile | null> {
  const ref = doc(usersCollection, userId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...(snapshot.data() as Omit<UserProfile, 'id'>) };
}
