import { useState, useEffect } from 'react';
import { Loader, MapPin } from 'lucide-react';

interface DestinationImageProps {
  destination: string | null | undefined;
  className?: string;
}

export function DestinationImage({ destination, className = '' }: DestinationImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!destination || destination.trim() === '') {
      setImageUrl('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setRetryCount(0);

    const fetchImage = async () => {
      try {
        // Method 1: Try Wikipedia API with improved search
        const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          destination
        )}&format=json&origin=*`;

        console.log('Searching Wikipedia for:', destination);
        const searchResponse = await fetch(wikiSearchUrl);
        const searchData = await searchResponse.json();

        const results = searchData.query?.search || [];
        if (results.length > 0) {
          const title = results[0].title;
          console.log('Found Wikipedia article:', title);

          // Now get the image for this article
          const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
            title
          )}&prop=pageimages&pithumbsize=1200&format=json&origin=*`;

          const imageResponse = await fetch(imageUrl);
          const imageData = await imageResponse.json();
          const pages = imageData.query?.pages || {};
          const firstPage = Object.values(pages)[0] as any;

          if (firstPage?.thumbnail?.source) {
            console.log('✓ Wikipedia image found:', firstPage.thumbnail.source);
            setImageUrl(firstPage.thumbnail.source);
            setIsLoading(false);
            return;
          }
        }

        // Method 2: Fallback to Wikimedia Commons search for better quality images
        console.log('✗ No Wikipedia image found, trying Wikimedia Commons...');
        const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          destination
        )}&srnamespace=6&format=json&origin=*`;

        const commonsResponse = await fetch(commonsUrl);
        const commonsData = await commonsResponse.json();
        const commonsResults = commonsData.query?.search || [];

        if (commonsResults.length > 0) {
          const fileName = commonsResults[0].title;
          console.log('Found Wikimedia Commons file:', fileName);

          // Get the image URL from Commons
          const fileUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(
            fileName
          )}&prop=imageinfo&iiprop=url&format=json&origin=*`;

          const fileResponse = await fetch(fileUrl);
          const fileData = await fileResponse.json();
          const filePages = fileData.query?.pages || {};
          const filePage = Object.values(filePages)[0] as any;

          if (filePage?.imageinfo?.[0]?.url) {
            const imageUrlFromCommons = filePage.imageinfo[0].url;
            console.log('✓ Wikimedia Commons image found:', imageUrlFromCommons);
            setImageUrl(imageUrlFromCommons);
            setIsLoading(false);
            return;
          }
        }

        // Method 3: Use Unsplash as reliable fallback with destination keyword
        console.log('✗ No Wikimedia image found, using Unsplash fallback');
        const unsplashUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(destination)},travel,city`;
        setImageUrl(unsplashUrl);
        setIsLoading(false);

      } catch (err) {
        console.error('Error fetching image:', err);
        // Fallback to Unsplash
        const unsplashUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(destination)},travel,city`;
        setImageUrl(unsplashUrl);
        setIsLoading(false);
      }
    };

    fetchImage();
  }, [destination]);

  const handleImageLoad = () => {
    console.log('✓ Image loaded successfully');
    setHasError(false);
    setIsLoading(false);
    setRetryCount(0);
  };

  const handleImageError = () => {
    console.error('✗ Image load failed for:', imageUrl);
    
    // Retry once with a different approach
    if (retryCount < 1) {
      console.log('Retrying with different image source...');
      setRetryCount(retryCount + 1);
      // Use a different Unsplash query
      const seed = Math.random();
      const fallbackUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(destination || '')},landmark,architecture,tourism&sig=${seed}`;
      setImageUrl(fallbackUrl);
      setHasError(false);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  if (!destination) {
    return null;
  }

  return (
    <div className={`relative w-full h-40 bg-gradient-to-br from-gray-300 to-gray-400 overflow-hidden flex items-center justify-center ${className}`}>
      {/* Loading spinner */}
      {isLoading && !imageUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-20">
          <Loader className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Error state */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-300 z-20">
          <MapPin className="h-10 w-10 text-gray-500 mb-2" />
          <p className="text-xs text-gray-600">No image available</p>
        </div>
      )}

      {/* Image - only render if we have a URL and no error */}
      {imageUrl && !hasError && (
        <img
          src={imageUrl}
          alt={`${destination} destination`}
          className={`w-full h-full object-cover ${isLoading ? 'hidden' : 'block'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </div>
  );
}