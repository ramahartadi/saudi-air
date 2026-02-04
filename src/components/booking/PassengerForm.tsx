import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import { BirthDatePicker } from './BirthDatePicker';

interface PassengerFormData {
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
}

interface PassengerFormProps {
  index: number;
  data: PassengerFormData;
  onChange: (data: PassengerFormData) => void;
}

export function PassengerForm({ index, data, onChange }: PassengerFormProps) {
  const handleChange = (field: keyof PassengerFormData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Card className="border-2 border-foreground">
      <CardHeader className="border-b-2 border-foreground bg-secondary">
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 border-2 border-foreground bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            {index + 1}
          </div>
          <User className="h-5 w-5" />
          Passenger {index + 1}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor={`title-${index}`} className="font-bold uppercase text-xs">Title</Label>
            <Select value={data.title} onValueChange={(v) => handleChange('title', v)}>
              <SelectTrigger id={`title-${index}`} className="border-2 border-foreground">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="bg-background border-2 border-foreground">
                <SelectItem value="Mr">Mr</SelectItem>
                <SelectItem value="Mrs">Mrs</SelectItem>
                <SelectItem value="Ms">Ms</SelectItem>
                <SelectItem value="Dr">Dr</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor={`firstName-${index}`} className="font-bold uppercase text-xs">First Name</Label>
            <Input
              id={`firstName-${index}`}
              value={data.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder="As in passport"
              className="border-2 border-foreground"
              required
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor={`lastName-${index}`} className="font-bold uppercase text-xs">Last Name</Label>
            <Input
              id={`lastName-${index}`}
              value={data.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder="As in passport"
              className="border-2 border-foreground"
              required
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label className="font-bold uppercase text-xs">Date of Birth</Label>
            <BirthDatePicker 
              value={data.dateOfBirth}
              onChange={(v) => handleChange('dateOfBirth', v)}
              label="Select Birth Date"
            />
          </div>

          {/* Nationality */}
          <div className="space-y-2">
            <Label htmlFor={`nationality-${index}`} className="font-bold uppercase text-xs">Nationality</Label>
            <Input
              id={`nationality-${index}`}
              value={data.nationality}
              onChange={(e) => handleChange('nationality', e.target.value)}
              placeholder="e.g., Indonesia"
              className="border-2 border-foreground h-10"
              required
            />
          </div>

          {/* Passport Number */}
          <div className="space-y-2">
            <Label htmlFor={`passport-${index}`} className="font-bold uppercase text-xs">Passport Number</Label>
            <Input
              id={`passport-${index}`}
              value={data.passportNumber}
              onChange={(e) => handleChange('passportNumber', e.target.value.toUpperCase())}
              placeholder="e.g., A12345678"
              className="border-2 border-foreground font-mono h-10"
              required
            />
          </div>

          {/* Passport Expiry */}
          <div className="space-y-2 md:col-span-3 lg:col-span-1">
            <Label className="font-bold uppercase text-xs">Passport Expiry</Label>
            <BirthDatePicker 
              value={data.passportExpiry}
              onChange={(v) => handleChange('passportExpiry', v)}
              label="Select Expiry Date"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
