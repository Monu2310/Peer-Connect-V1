import React from 'react';
import { Card, CardHeader, CardContent } from './card';
import { Skeleton } from './skeleton';

const SkeletonCard = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-32 w-full" />
        <div className="flex justify-between mt-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardContent>
    </Card>
  );
};

export default SkeletonCard;
