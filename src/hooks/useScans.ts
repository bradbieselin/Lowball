import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { scanProduct, getScan, getScans, saveScan, unsaveScan, getSavedScans, retryScan } from '../services/api';

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
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['scan', scanId],
    queryFn: () => getScan(scanId),
    enabled: !!scanId,
    staleTime: 60 * 1000,
    initialData: () => {
      // Check if this scan is already in the scans list cache
      const scansData = queryClient.getQueryData<any>(['scans']);
      if (scansData?.pages) {
        for (const page of scansData.pages) {
          const match = page.scans?.find((s: any) => s.id === scanId);
          if (match) return match;
        }
      }
      return undefined;
    },
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

export function useRetryScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ scanId, correctedProductName }: { scanId: string; correctedProductName: string }) =>
      retryScan(scanId, correctedProductName),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scan', variables.scanId] });
      queryClient.invalidateQueries({ queryKey: ['scans'] });
    },
  });
}

export function useSavedScans() {
  return useQuery({
    queryKey: ['savedScans'],
    queryFn: getSavedScans,
  });
}

export function useIsScanSaved(scanId: string) {
  const { data: savedScans } = useSavedScans();
  return savedScans?.some((s: any) => s.scanId === scanId) ?? false;
}

export function useSaveScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scanId: string) => saveScan(scanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedScans'] });
      queryClient.invalidateQueries({ queryKey: ['scans'] });
    },
  });
}

export function useUnsaveScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scanId: string) => unsaveScan(scanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedScans'] });
      queryClient.invalidateQueries({ queryKey: ['scans'] });
    },
  });
}
