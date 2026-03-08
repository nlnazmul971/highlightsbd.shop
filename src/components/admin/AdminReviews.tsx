import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const AdminReviews = () => {
  const qc = useQueryClient();

  const { data: reviews = [] } = useQuery({
    queryKey: ['all-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, products(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-reviews'] }),
  });

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">{reviews.length} review(s) total</p>

      {reviews.length === 0 ? (
        <p className="text-center py-20 text-muted-foreground">No reviews yet</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review: any) => (
            <div key={review.id} className="border border-border p-4 flex gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{review.name}</span>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} className={i < review.rating ? 'fill-foreground text-foreground' : 'text-muted-foreground/30'} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {(review.products as any)?.name || 'Unknown product'} • {new Date(review.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              </div>
              <button
                onClick={async () => {
                  if (confirm('Delete this review?')) {
                    await deleteReview.mutateAsync(review.id);
                    toast.success('Review deleted');
                  }
                }}
                className="p-2 h-fit hover:bg-destructive/10 text-destructive transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
