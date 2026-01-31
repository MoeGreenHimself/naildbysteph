import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ExternalLink } from "lucide-react";

export function AdBlock({ placement }: { placement: string }) {
  const { data: ads = [] } = trpc.ads.list.useQuery();
  const trackMutation = trpc.ads.track.useMutation();
  
  const filteredAds = ads.filter(ad => ad.adType === "block" && ad.placement === placement);
  
  useEffect(() => {
    filteredAds.forEach(ad => {
      trackMutation.mutate({ adId: ad.id, eventType: "impression" });
    });
  }, [filteredAds.length]);

  if (filteredAds.length === 0) return null;

  return (
    <div className="space-y-4 my-6">
      {filteredAds.map(ad => (
        <Card key={ad.id} className="overflow-hidden border-pink-100 hover:border-pink-300 transition-colors">
          <a 
            href={ad.linkUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={() => trackMutation.mutate({ adId: ad.id, eventType: "click" })}
            className="block"
          >
            {ad.imageUrl && (
              <img src={ad.imageUrl} alt={ad.title} className="w-full h-32 object-cover" />
            )}
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-sm text-gray-900">{ad.title}</h4>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">{ad.description}</p>
              <div className="mt-2 text-[10px] font-bold text-pink-600 uppercase tracking-wider">Sponsored</div>
            </div>
          </a>
        </Card>
      ))}
    </div>
  );
}

export function AdPopup() {
  const { data: ads = [] } = trpc.ads.list.useQuery();
  const trackMutation = trpc.ads.track.useMutation();
  const [currentAd, setCurrentAd] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const popupAds = ads.filter(ad => ad.adType === "popup");
    if (popupAds.length > 0) {
      // Show a random popup ad after 5 seconds
      const timer = setTimeout(() => {
        const randomAd = popupAds[Math.floor(Math.random() * popupAds.length)];
        setCurrentAd(randomAd);
        setIsVisible(true);
        trackMutation.mutate({ adId: randomAd.id, eventType: "impression" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [ads.length]);

  if (!isVisible || !currentAd) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="relative max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white rounded-full"
          onClick={() => setIsVisible(false)}
        >
          <X className="w-4 h-4" />
        </Button>
        
        <a 
          href={currentAd.linkUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => {
            trackMutation.mutate({ adId: currentAd.id, eventType: "click" });
            setIsVisible(false);
          }}
        >
          {currentAd.imageUrl && (
            <img src={currentAd.imageUrl} alt={currentAd.title} className="w-full h-48 object-cover" />
          )}
          <div className="p-6 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{currentAd.title}</h3>
            <p className="text-sm text-gray-600 mb-6">{currentAd.description}</p>
            <Button className="w-full bg-pink-600 hover:bg-pink-700">
              Check It Out
            </Button>
            <p className="mt-4 text-[10px] text-gray-400 uppercase tracking-widest">Partner Advertisement</p>
          </div>
        </a>
      </Card>
    </div>
  );
}
