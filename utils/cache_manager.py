# utils/cache_manager.py
import hashlib
import json
from datetime import datetime, timedelta
from typing import Optional, Any
import pickle

class CacheManager:
    """In-memory cache with TTL support. Can be extended to Redis for production."""
    
    def __init__(self):
        self._cache = {}
        self._stats = {"hits": 0, "misses": 0}
    
    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate a unique cache key from arguments"""
        # Combine all inputs into a single string
        key_data = f"{prefix}:{args}:{sorted(kwargs.items())}"
        # Hash it for consistent length
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[Any]:
        """Retrieve cached value if not expired"""
        if key in self._cache:
            value, expiry = self._cache[key]
            if datetime.now() < expiry:
                self._stats["hits"] += 1
                return value
            else:
                # Expired, remove it
                del self._cache[key]
        
        self._stats["misses"] += 1
        return None
    
    def set(self, key: str, value: Any, ttl_hours: int = 24):
        """Store value with expiration time"""
        expiry = datetime.now() + timedelta(hours=ttl_hours)
        self._cache[key] = (value, expiry)
    
    def delete(self, key: str):
        """Remove specific key from cache"""
        if key in self._cache:
            del self._cache[key]
    
    def clear(self):
        """Clear entire cache"""
        self._cache.clear()
        self._stats = {"hits": 0, "misses": 0}
    
    def get_stats(self) -> dict:
        """Get cache performance statistics"""
        total = self._stats["hits"] + self._stats["misses"]
        hit_rate = (self._stats["hits"] / total * 100) if total > 0 else 0
        
        return {
            "hits": self._stats["hits"],
            "misses": self._stats["misses"],
            "hit_rate": f"{hit_rate:.2f}%",
            "cache_size": len(self._cache)
        }
    
    def cleanup_expired(self):
        """Remove all expired entries"""
        now = datetime.now()
        expired_keys = [
            key for key, (_, expiry) in self._cache.items()
            if now >= expiry
        ]
        for key in expired_keys:
            del self._cache[key]
        
        return len(expired_keys)

# Global cache instance
cache = CacheManager()

# Decorator for easy caching
def cached(ttl_hours: int = 24, prefix: str = "default"):
    """Decorator to cache function results"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = cache._generate_key(f"{prefix}:{func.__name__}", *args, **kwargs)
            
            # Try to get from cache
            result = cache.get(cache_key)
            if result is not None:
                return result
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Store in cache
            cache.set(cache_key, result, ttl_hours)
            return result
        
        return wrapper
    return decorator