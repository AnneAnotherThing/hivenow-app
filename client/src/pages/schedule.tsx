import { useState } from 'react';
import { useLocation } from 'wouter';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function Schedule() {
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [bookingType, setBookingType] = useState<string>('consultation');
  
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  // Get query params to determine if this is a consultation or fact finding mission
  const queryParams = new URLSearchParams(window.location.search);
  const type = queryParams.get('type') || 'consultation';

  useState(() => {
    setBookingType(type);
  });

  const availableTimes = [
    '9:00 AM', '10:00 AM', '11:00 AM', 
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !time || !name || !email || !phone) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all fields to schedule your appointment.',
        variant: 'destructive',
      });
      return;
    }
    
    setConfirmOpen(true);
  };

  const confirmBooking = () => {
    setConfirmOpen(false);
    setSuccessOpen(true);
    
    // In a real application, we would send this to the server
    // For now we'll just simulate success
    console.log('Scheduled:', {
      type: bookingType,
      date: format(date!, 'PPP'),
      time,
      name,
      email,
      phone
    });
  };

  const handleSuccessClose = () => {
    setSuccessOpen(false);
    navigate('/');
  };

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {bookingType === 'consultation' 
            ? 'Schedule Your Consultation' 
            : 'Schedule Your Fact Finding Mission'}
        </h1>
        
        <p className="mb-8 text-center text-gray-600">
          {bookingType === 'consultation'
            ? 'Choose a date and time for your one-on-one consultation with our experts.'
            : 'Select when you would like to have your comprehensive fact finding session with our team.'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="font-semibold text-lg mb-4">Select a Date</h2>
              <div className="border rounded-md p-4">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => {
                    // Disable weekends and past dates
                    const day = date.getDay();
                    return (
                      date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                      day === 0 ||
                      day === 6
                    );
                  }}
                  className="rounded-md"
                />
              </div>
            </div>
            
            <div>
              <h2 className="font-semibold text-lg mb-4">Select a Time</h2>
              <div className="grid grid-cols-2 gap-2">
                {availableTimes.map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={time === t ? 'default' : 'outline'}
                    onClick={() => setTime(t)}
                    className="justify-center"
                  >
                    {t}
                  </Button>
                ))}
              </div>
              
              <h2 className="font-semibold text-lg mt-8 mb-4">Your Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="john@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="(123) 456-7890"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mt-8">
            <Button
              type="submit"
              disabled={!date || !time || !name || !email || !phone}
              className="w-full max-w-md"
            >
              Schedule Now
            </Button>
          </div>
        </form>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Appointment</DialogTitle>
            <DialogDescription>
              Please review the details of your scheduled appointment.
            </DialogDescription>
          </DialogHeader>
          
          {date && (
            <div className="py-4 space-y-2">
              <p><span className="font-medium">Type:</span> {bookingType === 'consultation' ? 'Consultation' : 'Fact Finding Mission'}</p>
              <p><span className="font-medium">Date:</span> {format(date, 'PPP')}</p>
              <p><span className="font-medium">Time:</span> {time}</p>
              <p><span className="font-medium">Name:</span> {name}</p>
              <p><span className="font-medium">Email:</span> {email}</p>
              <p><span className="font-medium">Phone:</span> {phone}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Go Back
            </Button>
            <Button onClick={confirmBooking}>
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Success Dialog */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Confirmed!</DialogTitle>
            <DialogDescription>
              Your appointment has been successfully scheduled.
            </DialogDescription>
          </DialogHeader>
          
          {date && (
            <div className="py-4 space-y-2">
              <p>We've booked your {bookingType === 'consultation' ? 'consultation' : 'fact finding mission'} for:</p>
              <p className="font-bold">{format(date, 'PPP')} at {time}</p>
              <p className="mt-4">A confirmation email has been sent to {email}. Our team will call you at the scheduled time.</p>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={handleSuccessClose}>
              Return to Home
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}