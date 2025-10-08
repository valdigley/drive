/*
  # Fix existing supplier galleries type

  1. Changes
    - Update existing supplier galleries to have type 'supplier'
    - This fixes galleries that were created before the gallery_type feature
    
  2. Notes
    - Finds all galleries linked to suppliers and marks them as 'supplier' type
*/

-- Update all galleries that are linked to suppliers to be type 'supplier'
UPDATE galleries 
SET gallery_type = 'supplier'
WHERE id IN (
  SELECT gallery_id 
  FROM suppliers 
  WHERE gallery_id IS NOT NULL
);
