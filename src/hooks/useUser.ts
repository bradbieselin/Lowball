import { useQuery } from '@tanstack/react-query';
import { getUserProfile, getUserStats } from '../services/api';

export function useUserProfile() {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserProfile,
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: ['userStats'],
    queryFn: getUserStats,
  });
}
