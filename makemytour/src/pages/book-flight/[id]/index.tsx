// src/pages/book-flight/[id]/index.tsx

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import ReviewList from "@/components/ReviewList";
import LiveFlightStatus from "@/components/LiveFlightStatus";
import SeatMap from "@/components/SeatMap";
import Recommendations from "@/components/Recommendations";
import SignupDialog from "@/components/SignupDialog";
import Loader from "@/components/Loader";
import AddBasePrice from "@/components/Pricing/AddBasePrice";

import { getflight, bookFlight, recordInteraction } from "@/api";
import { setUser } from "@/store";

import {
  Plane,
  Clock,
  Calendar,
  ArrowRight,
  CreditCard,
} from "lucide-react";

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

interface Flight {
  id: string;
  flightName: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  availableSeats: number;
}

const BookFlightPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState<number>(1);
  const [open, setOpen] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [seatPrice, setSeatPrice] = useState(0); // now total price


  // Fix #2 & #3: dynamic price
  const [dynamicPrice, setDynamicPrice] = useState<number | null>(null);

  const user = useSelector((state: any) => state.user.user);
  const dispatch = useDispatch();

  // -------------------------------------------------------------------
  // FETCH FLIGHTS
  // -------------------------------------------------------------------
  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const data = await getflight();
        const filtered = data.filter((f: any) => String(f.id) === String(id));
        setFlights(filtered);
      } catch (err) {
        console.error("Failed to fetch flight:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchFlights();
  }, [id]);

  const currentUserId = user?.id || user?._id || null;

  // -------------------------------------------------------------------
  // FETCH REAL DYNAMIC PRICE (Fix #2)
  // -------------------------------------------------------------------
  useEffect(() => {
    const fetchDynamicPrice = async () => {
      if (!id) return;

      try {
        const res = await fetch(
          `http://localhost:8080/pricing/flight/${id}/price`
        );
        const data = await res.json();

        if (data.currentPrice != null) {
          setDynamicPrice(data.currentPrice);
        }
      } catch (err) {
        console.error("Failed to fetch dynamic price:", err);
      }
    };

    fetchDynamicPrice();
  }, [id]);

  // -------------------------------------------------------------------
  // FIX #3 — Update flight object with dynamic price everywhere
  // -------------------------------------------------------------------
  useEffect(() => {
    if (dynamicPrice !== null && flights.length > 0) {
      const updated = { ...flights[0], price: dynamicPrice };
      setFlights([updated]);
    }
  }, [dynamicPrice]);

  // -------------------------------------------------------------------
  // RECORD VIEW
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!currentUserId || flights.length === 0) return;

    const sendView = async () => {
      try {
        await recordInteraction({
          userId: currentUserId,
          entityType: "flight",
          entityId: flights[0].id,
          action: "view",
        });
      } catch (e) {
        console.error("Failed to record interaction:", e);
      }
    };

    sendView();
  }, [currentUserId, flights]);

  if (loading) return <Loader />;

  if (flights.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        No flight found.
      </div>
    );
  }

  const flight = flights[0];

  // -------------------------------------------------------------------
  // FORMAT DATE
  // -------------------------------------------------------------------
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // -------------------------------------------------------------------
  // QUANTITY CHANGE
  // -------------------------------------------------------------------
  const handleQuantityChange = (e: any) => {
    const value = Number(e.target.value);
    setQuantity(
      isNaN(value) ? 1 : Math.max(1, Math.min(value, flight.availableSeats))
    );
  };

  // -------------------------------------------------------------------
  // FIX #2 + #3: Use dynamic price everywhere
  // -------------------------------------------------------------------
  const currentFare = dynamicPrice ?? flight.price;
  const totalPrice = currentFare * selectedSeats.length;

  // -------------------------------------------------------------------
  // BOOKING HANDLER
  // -------------------------------------------------------------------
  const handlebooking = async (e: any) => {
    e.preventDefault();

    if (!user) {
      setOpen(true);
      return;
    }
	
	if (selectedSeats.length === 0) {
	  alert("Please select at least one seat.");
	  return;
	}



    try {
		const booking = await bookFlight({
		  userId: user.id || user._id,
		  flightId: flight.id,
		  seats: selectedSeats.length,
		  price: totalPrice + seatPrice,
		  seatId: selectedSeats.join(","),   // comma separated
		  seatPrice: seatPrice ?? 0,
		});


      dispatch(
        setUser({
          ...user,
          bookings: [...(user.bookings || []), booking],
        })
      );

      router.push("/profile");
    } catch (error: any) {
      alert(error?.response?.data?.message || "Booking failed");
    }
  };

  // -------------------------------------------------------------------
  // BOOKING POPUP
  // -------------------------------------------------------------------
  const BookingContent = () => (
    <DialogContent className="bg-white sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle className="flex items-center text-2xl font-bold">
          <Plane className="w-6 h-6 mr-2" /> Flight Booking Details
        </DialogTitle>
      </DialogHeader>

      <div className="grid gap-6 mt-4">
        
        {/* Flight details form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Flight Name</Label>
            <Input value={flight.flightName} readOnly />
          </div>

          <div>
            <Label>From</Label>
            <Input value={flight.from} readOnly />
          </div>

          <div>
            <Label>To</Label>
            <Input value={flight.to} readOnly />
          </div>

          <div>
            <Label>Departure Time</Label>
            <Input value={formatDate(flight.departureTime)} readOnly />
          </div>

          <div>
            <Label>Arrival Time</Label>
            <Input value={formatDate(flight.arrivalTime)} readOnly />
          </div>

          <div>
            <Label>Tickets</Label>
			<Input value={selectedSeats.length} readOnly />
          </div>
        </div>

        {/* Fare summary */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-bold mb-3 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" /> Fare Summary
          </h3>

		  <div className="flex justify-between">
		    <span>Flight Fare</span>
		    <span className="font-bold">₹ {totalPrice.toLocaleString()}</span>
		  </div>

		  {seatPrice > 0 && (
		    <div className="flex justify-between text-blue-700 mt-2">
		      <span>Seat Upgrade Fee</span>
		      <span className="font-bold">₹ {seatPrice.toLocaleString()}</span>
		    </div>
		  )}

		  <div className="flex justify-between mt-3 text-lg">
		    <span>Total Payable</span>
		    <span className="font-bold">₹ {(totalPrice + seatPrice).toLocaleString()}</span>
		  </div>


          <p className="text-xs text-green-600 mt-1">
            Dynamic price applied: ₹{currentFare}
          </p>
        </div>
      </div>

      <Button className="w-full mt-4" onClick={handlebooking}>
        Proceed to Payment
      </Button>
    </DialogContent>
  );

  // -------------------------------------------------------------------
  // PAGE RETURN
  // -------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#f4f7fa]">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Flight Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold flex items-center">
              {flight.from} <ArrowRight className="w-5 h-5 mx-2" /> {flight.to}
            </h2>

            <p className="text-sm text-gray-600 flex items-center mt-2">
              <Calendar className="w-4 h-4 mr-2" />
              {formatDate(flight.departureTime)}
            </p>

            <p className="mt-2 flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-2" /> Non-stop flight
            </p>

            {/* FIX #3: Show updated dynamic price directly in flight card */}
            <p className="text-green-700 text-xl font-bold mt-3">
              ₹ {currentFare.toLocaleString()}
              <span className="text-sm text-gray-500 ml-1">
                (Dynamic Price)
              </span>
            </p>
          </div>

          {/* Fix #1: Admin-only Dynamic Pricing Panel */}
          {user?.role === "ADMIN" && (
            <AddBasePrice flightId={String(id)} />
          )}

          {/* Live Status + Seat Map */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-3">
              Live Flight & Seat Selection
            </h3>

            <LiveFlightStatus flightId={flight.id} />

			<SeatMap
			   flightId={flight.id}
			   userId={currentUserId}
			   onSeatSelected={(seatIds) => setSelectedSeats(seatIds)}   // now array
			      onSeatPriceChange={(totalSeatPrice) => setSeatPrice(totalSeatPrice)}
			   />
          </div>

          {/* Recommendations */}
          <Recommendations userId={currentUserId} limit={6} />

          {/* Reviews */}
          <ReviewList entityType="FLIGHT" entityId={flight.id} />
        </div>

        {/* RIGHT FARE SUMMARY */}
        <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24 h-fit">
          <h2 className="text-lg font-bold mb-6 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" /> Fare Summary
          </h2>

		  <div className="flex justify-between mb-2">
		    <span>Flight Fare</span>
		    <strong>₹ {totalPrice.toLocaleString()}</strong>
		  </div>

		  {seatPrice > 0 && (
		    <div className="flex justify-between mb-2 text-blue-700">
		      <span>Seat Upgrade Fee</span>
		      <strong>₹ {seatPrice.toLocaleString()}</strong>
		    </div>
		  )}

		  <div className="flex justify-between mt-3 text-lg">
		    <span>Total Payable</span>
		    <strong>₹ {(totalPrice + seatPrice).toLocaleString()}</strong>
		  </div>


          <p className="text-xs text-green-600">
            Dynamic price applied: ₹{currentFare}
          </p>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
			<Button
			  className="w-full bg-red-600 text-white"
			  disabled={selectedSeats.length === 0}
			>
			{selectedSeats.length > 0 ? "Book Now" : "Select Seats First"}
			</Button>

            </DialogTrigger>

            {user ? (
              <BookingContent />
            ) : (
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Login Required</DialogTitle>
                </DialogHeader>
                <p>Please log in to continue.</p>
                <SignupDialog
                  trigger={
                    <Button className="w-full">Log In / Sign Up</Button>
                  }
                />
              </DialogContent>
            )}
          </Dialog>
        </div>

      </div>
    </div>
  );
};

export default BookFlightPage;
