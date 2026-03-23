import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { scanProduct, getScan, getScans, saveScan, unsaveScan } from '../services/api';

export function useScanProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageUri: string) => scanProduct(imageUri),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
    },
  });
}

export function useScan(scanId: string) {
  return useQuery({
    queryKey: ['scan', scanId],
    queryFn: () => getScan(scanId),
    enabled: !!scanId,
  });
}

export function useRecentScans() {
  return useInfiniteQuery({
    queryKey: ['scans'],
    queryFn: ({ pageParam = 1 }) => getScans(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}

export function useSaveScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scanId: string) => saveScan(scanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
    },
  });
}

export function useUnsaveScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scanId: string) => unsaveScan(scanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
    },
  });
}
