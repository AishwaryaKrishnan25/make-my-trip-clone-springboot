// src/pages/book-hotel/[id]/index.tsx
import { useRouter } from "next/router";
import ReviewList from "@/components/ReviewList";
import RoomGrid from "@/components/RoomGrid";
import {
  Star,
  MapPin,
  School as Pool,
  UtensilsCrossed,
  Wine,
  Power,
  ChevronRight,
  Camera,
  Image,
  CreditCard,
  Ticket,
  Plane,
  Home,
} from "lucide-react";
import { useEffect, useState } from "react";
import { gethotel, bookHotel } from "@/api"; // ensure src/api/index.js exports bookHotel
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDispatch, useSelector } from "react-redux";
import SignupDialog from "@/components/SignupDialog";
import Loader from "@/components/Loader";
import { setUser } from "@/store";

interface Hotel {
  id: string;
  hotelName: string;
  location: string;
  pricePerNight: number;
  availableRooms: number;
  amenities: string;
}

const BookHotelPage: React.FC = () => {
  const [quantity, setQuantity] = useState<number>(1);
  const router = useRouter();
  const { id } = router.query; // hotel id from route
  const [hotels, sethotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const user = useSelector((state: any) => state.user.user);
  const [open, setopem] = useState<boolean>(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchhotels = async () => {
      try {
        const data = await gethotel();
        // backend uses `id` field - match it
        const filteredData = data.filter((hotel: any) => String(hotel.id) === String(id));
        sethotels(filteredData);
      } catch (error) {
        console.error("Error fetching hotels:", error);
      } finally {
        setLoading(false);
      }
    };
    // fetch only when id is available (Next router may be undefined at first)
    if (id) {
      fetchhotels();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <Loader />;
  }

  const hotel = hotels[0] as Hotel | undefined;
  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Hotel not found</h2>
          <p className="mt-2 text-gray-600">The hotel you requested could not be loaded.</p>
        </div>
      </div>
    );
  }

  // sample static hotelData used in your UI
  const hotelData = {
    name: hotel.hotelName,
    rating: 3,
    maxRating: 5,
    propertyPhotos: 91,
    guestPhotos: 386,
    description:
      "One of the best hotels in North Goa, operating since 2001 catering to international and domestic individual and group travelers.",
    amenities: [
      { icon: <Pool className="w-5 h-5" />, name: "Swimming Pool" },
      { icon: <UtensilsCrossed className="w-5 h-5" />, name: "Restaurant" },
      { icon: <Wine className="w-5 h-5" />, name: "Bar" },
      { icon: <Power className="w-5 h-5" />, name: "Power Backup" },
    ],
    room: {
      type: "Standard Room",
      capacity: "Fits 2 Adults",
      features: [
        "No meals included",
        "10% off on food & beverage services",
        "Complimentary welcome drinks on arrival",
        "Non-Refundable",
      ],
      originalPrice: 8999,
      discountedPrice: 664,
      taxes: 527,
    },
    location: {
      area: "Candolim",
      distance: "7 minutes walk to Candolim Beach",
    },
    reviews: {
      rating: 3.8,
      count: 784,
      text: "Very Good",
    },
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const value = Number.parseInt(e.target.value);
    setQuantity(isNaN(value) ? 1 : Math.max(1, Math.min(value, hotel.availableRooms)));
  };

  const totalPrice = hotel.pricePerNight * quantity;
  const totalTaxes = hotelData.room.taxes * quantity;
  const totalDiscounts = hotelData.room.discountedPrice * quantity;
  const grandTotal = totalPrice + totalTaxes - totalDiscounts;

  const handlebooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      // open signup/login dialog if no user (your UI uses SignupDialog)
      setopem(true);
      return;
    }
    try {
      const userId = user?.id || user?._id;
      const hotelId = hotel.id;
      const rooms = quantity;
      const price = grandTotal;

      const data = await bookHotel({ userId, hotelId, rooms, price });

      // update user in redux (if you keep bookings in user object)
      const updateuser = {
        ...user,
        bookings: [...(user?.bookings || []), data],
      };
      dispatch(setUser(updateuser));

      setopem(false);
      setQuantity(1);
      router.push("/profile");
    } catch (error: any) {
      console.error("Booking failed:", error);
      const msg = error?.response?.data?.message || error?.message || "Booking failed";
      // show a minimal alert; you can replace with toast
      alert(msg);
    }
  };

  const HotelContent = () => (
    <DialogContent className="sm:max-w-[600px] bg-white">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold flex items-center">
          <Home className="w-6 h-6 mr-2" />
          Hotel Booking Details
        </DialogTitle>
      </DialogHeader>
      <div className="grid gap-6 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hotel Name */}
          <div className="space-y-2">
            <Label htmlFor="hotelName" className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Hotel Name
            </Label>
            <Input id="hotelName" value={hotel.hotelName} readOnly />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Location
            </Label>
            <Input id="location" value={hotel.location} readOnly />
          </div>
          {/* Price Per Night */}
          <div className="space-y-2">
            <Label htmlFor="pricePerNight" className="flex items-center">
              <Ticket className="w-4 h-4 mr-2" />
              Price Per Night
            </Label>
            <Input id="pricePerNight" value={`₹ ${hotel.pricePerNight}`} readOnly />
          </div>

          {/* Available Rooms */}
          <div className="space-y-2">
            <Label htmlFor="availableRooms" className="flex items-center">
              <Ticket className="w-4 h-4 mr-2" />
              Available Rooms
            </Label>
            <Input id="availableRooms" value={hotel.availableRooms} readOnly />
          </div>

          {/* Number of Rooms to Book */}
          <div className="space-y-2">
            <Label htmlFor="quantity" className="flex items-center">
              <Ticket className="w-4 h-4 mr-2" />
              Number of Rooms to Book
            </Label>
            <Input id="quantity" type="number" min="1" max={hotel.availableRooms} value={quantity} onChange={handleQuantityChange} />
          </div>
        </div>
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Fare Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Base Fare</span>
              <span className="font-medium">₹ {totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Taxes and Extracharges</span>
              <span className="font-medium">₹ {totalTaxes.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-green-600">
              <span className="font-medium">Discounts</span>
              <span className="font-medium">- ₹ {Math.abs(totalDiscounts).toLocaleString()}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total Amount</span>
                <span className="font-bold text-lg">₹ {grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Button className="w-full mt-4" onClick={handlebooking}>
        Proceed to Payment
      </Button>
    </DialogContent>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 text-sm">
            <a href="/" className="text-blue-500">Home</a>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <a href="/" className="text-blue-500">{hotel?.location}</a>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{hotel?.hotelName}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Hotel Title & Rating */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">{hotel.hotelName}</h1>
              <div className="flex items-center space-x-1">
                {[...Array(hotelData.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
                {[...Array(hotelData.maxRating - hotelData.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-gray-300" />
                ))}
              </div>
            </div>

            {/* Image Gallery */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="col-span-2 relative group cursor-pointer">
                <img
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800"
                  alt="Hotel Main"
                  className="w-full h-80 object-cover rounded-lg"
                />
                <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 rounded-full flex items-center space-x-1">
                  <Camera className="w-4 h-4" />
                  <span className="text-sm">+{hotelData.propertyPhotos} Property Photos</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="relative group cursor-pointer">
                  <img
                    src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800"
                    alt="Hotel Room"
                    className="w-full h-[152px] object-cover rounded-lg"
                  />
                </div>
                <div className="relative group cursor-pointer">
                  <img
                    src="https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800"
                    alt="Hotel Amenity"
                    className="w-full h-[152px] object-cover rounded-lg"
                  />
                  <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 rounded-full flex items-center space-x-1">
                    <Image className="w-4 h-4" />
                    <span className="text-sm">+{hotelData.guestPhotos} Guest Photos</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-6">
              {hotelData.description}
              <button className="text-blue-500 ml-2">Read more</button>
            </p>

            {/* Amenities */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Amenities</h2>
              <div className="flex flex-wrap gap-6">
                {hotelData.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center space-x-2 text-gray-600">
                    {amenity.icon}
                    <span>{amenity.name}</span>
                  </div>
                ))}
                <button className="text-blue-500">+ 31 Amenities</button>
              </div>
            </div>

            {/* Room Grid (interactive room selection + 3D preview) */}
            <div className="mb-8">
              <RoomGrid hotelId={hotel.id} />
            </div>

          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">{hotelData.room.type}</h3>
              <p className="text-gray-600 mb-4">{hotelData.room.capacity}</p>

              <ul className="space-y-3 mb-6">
                {hotelData.room.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-800 font-semibold">Price Per Night:</span>
                  <span className="text-lg font-medium text-gray-800">₹ {totalPrice}</span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-800 font-semibold">Available Rooms:</span>
                  <span className="text-lg font-medium text-gray-800">{hotel.availableRooms}</span>
                </div>

                <div>
                  <h4 className="text-gray-800 font-semibold mb-2">Amenities:</h4>
                  <p className="text-gray-600">{hotel.amenities}</p>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 line-through">₹ {totalPrice}</span>
                  <span className="text-gray-500">Per Night:</span>
                </div>
                <div className="flex items-center justify-between text-2xl font-bold">
                  <span>₹ {grandTotal}</span>
                  <span className="text-sm text-gray-500 font-normal">+ ₹ {totalTaxes} taxes & fees</span>
                </div>
              </div>

              <Dialog open={open} onOpenChange={setopem}>
                <DialogTrigger asChild>
                  <button className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors mb-3">BOOK THIS NOW</button>
                </DialogTrigger>
                {user ? (
                  <HotelContent />
                ) : (
                  <DialogContent className="bg-white">
                    <DialogHeader>
                      <DialogTitle>Login Required</DialogTitle>
                    </DialogHeader>
                    <p>Please log in to continue with your booking.</p>
                    <SignupDialog trigger={<Button className="w-full">Log In / Sign Up</Button>} />
                  </DialogContent>
                )}
              </Dialog>

              <button className="w-full text-blue-500 text-center">14 More Options</button>
            </div>

            {/* Rating Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-500 text-white text-2xl font-bold w-16 h-16 rounded-lg flex items-center justify-center">
                    {hotelData.reviews.rating}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{hotelData.reviews.text}</div>
                    <div className="text-gray-500">({hotelData.reviews.count} ratings)</div>
                  </div>
                </div>
                <a href="#" className="text-blue-500">All Reviews</a>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{hotel.location}</h3>
                </div>
                <button className="text-blue-500">See on Map</button>
              </div>
            </div>

            {/* Reviews */}
            <div className="mt-8">
              <ReviewList entityType="HOTEL" entityId={hotel.id || String(id)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookHotelPage;
