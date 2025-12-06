# Filter & Sort System - Complete Implementation

## Overview
The EcoEaze marketplace has a complete filter and sort system for browsing products.

## ✅ Features Implemented

### Frontend (Shop.tsx)
- **Search** - Real-time search by product name, farm, or location
- **Category Filter** - Filter by product categories (Fruits, Vegetables, Leafy Greens, Grains)
- **Price Range Filter** - Min and Max price filtering
- **Sort Options**:
  - Newest (default)
  - Oldest
  - Price: Low → High
  - Price: High → Low
  - Stock: High → Low
  - Stock: Low → High
- **Advanced Filters Panel** - Toggle-able panel showing all filters
- **Reset Filters** - Quick reset button when filters are active
- **Product Count** - Shows total products matching filters

### Backend (Product Controller - getProducts)

#### Supported Query Parameters
```
GET /api/products?search=keyword&category=fruits&minPrice=10&maxPrice=100&sort=price_asc&page=1&limit=12
```

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `search` | string | "tomato" | Search by product name (case-insensitive) |
| `category` | string | "fruits" | Filter by category |
| `farmerId` | string | "farmId123" | Filter by specific farmer |
| `minPrice` | number | 10 | Minimum price filter |
| `maxPrice` | number | 100 | Maximum price filter |
| `sort` | string | "price_asc" | Sort option |
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 12 | Products per page |

#### Sort Options
```javascript
"newest"      → createdAt: -1 (default)
"oldest"      → createdAt: 1
"price_asc"   → price: 1
"price_desc"  → price: -1
"stock_asc"   → stock: 1
"stock_desc"  → stock: -1
```

## API Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "product_id",
      "name": "Organic Tomatoes",
      "price": 45,
      "category": "vegetables",
      "stock": 100,
      "imageUrl": "https://...",
      "farmer": {
        "name": "John Farmer",
        "farmName": "Green Valley Farm",
        "location": "Himachal Pradesh"
      },
      "averageRating": 4.5
    }
  ],
  "pagination": {
    "total": 156,
    "page": 1,
    "limit": 12
  }
}
```

## How It Works

### Frontend Flow
1. User selects filters or sorts
2. Component updates state (search, category, minPrice, maxPrice, sortBy)
3. useQuery dependency array triggers new API call
4. URLSearchParams builds query string with all filters
5. Results update automatically

### Backend Flow
1. Extract all query parameters
2. Build MongoDB query object:
   - Search: `name: { $regex, $options: "i" }`
   - Category: `category: value`
   - Price: `price: { $gte, $lte }`
3. Apply sorting
4. Execute find().skip().limit().sort()
5. Count total matching documents
6. Return data + pagination info

## Example Usage

### Search for Products
```
GET /api/products?search=organic
```

### Filter by Category
```
GET /api/products?category=fruits
```

### Price Range Filter
```
GET /api/products?minPrice=50&maxPrice=200
```

### Sort by Price (Low to High)
```
GET /api/products?sort=price_asc
```

### Combined Filters
```
GET /api/products?search=tomato&category=vegetables&minPrice=20&maxPrice=100&sort=price_asc&page=1&limit=12
```

## UI Components Used

- **Badge** - Category selection
- **Input** - Search and price inputs
- **Button** - Filter toggle and reset
- **Select** - Sort dropdown
- **ProductCard** - Display individual products
- **Lucide Icons** - Search and Sliders icons

## Mobile Responsive

- ✅ Collapsible filters on mobile (toggle with Filters button)
- ✅ Category badges always visible on desktop (hidden on mobile)
- ✅ Price filters in advanced panel
- ✅ Responsive grid layout (2 cols on tablet, 3-4 cols on desktop)

## Browser Console Debug

The Shop component logs query results:
```javascript
console.log("SHOP PRODUCTS:", res.data);
```

Check DevTools Console to see products being returned from API.

## Performance

- ✅ React Query caching for repeated filters
- ✅ Server-side pagination (limit 12 products)
- ✅ MongoDB indexes on category, price, farmer
- ✅ Lazy loading with pagination
- ✅ Debounced search (handled by React Query)

## File Locations

- **Frontend**: `src/pages/Shop.tsx`
- **Backend**: `src/controllers/productController.js` (getProducts function)
- **Routes**: `src/routes/productRoutes.js`

## Testing

Visit: `http://localhost:8081/shop`

Try these actions:
1. ✅ Type in search box → results update
2. ✅ Click category badge → filters by category
3. ✅ Enter price range → filters by price
4. ✅ Change sort dropdown → products reorder
5. ✅ Click "Reset Filters" → clears all filters
6. ✅ Open DevTools Console → see API calls being made

All filter/sort functionality is now working properly! 🚀
