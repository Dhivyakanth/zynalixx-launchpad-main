import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Phone, 
  Mail, 
  User, 
  Building2, 
  MessageSquare, 
  Calendar,
  DollarSign,
  FileText,
  Send,
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { submitBookCallForm } from "@/lib/api";
import PageTransition from "@/components/PageTransition";
import SectionHeading from "@/components/SectionHeading";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const bookCallSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  company: z.string().optional(),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  projectType: z.string().min(1, "Please select a project type"),
  budget: z.string().min(1, "Please select a budget range"),
  timeline: z.string().min(1, "Please select a timeline"),
  description: z.string().min(20, "Please provide more details about your project"),
});

type BookCallFormData = z.infer<typeof bookCallSchema>;

const projectTypes = [
  "Web Application",
  "Mobile App",
  "E-Commerce Platform",
  "AI/ML Solution",
  "UI/UX Design",
  "Full Stack Development",
  "Digital Marketing",
  "Custom Software",
  "Other",
];

const budgetRanges = [
  "₹10,000 - ₹50,000",
  "₹50,000 - ₹1,00,000",
  "₹1,00,000 - ₹3,00,000",
  "₹3,00,000 - ₹5,00,000",
  "₹5,00,000+",
  "Not Sure Yet",
];

const timelines = [
  "ASAP (Rush)",
  "1-2 Weeks",
  "1 Month",
  "2-3 Months",
  "3-6 Months",
  "Flexible",
];

const BookCall = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<BookCallFormData>({
    resolver: zodResolver(bookCallSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      projectType: "",
      budget: "",
      timeline: "",
      description: "",
    },
  });

  const onSubmit = async (data: BookCallFormData) => {
    setIsSubmitting(true);

    try {
      await submitBookCallForm(data);

      setIsSuccess(true);
      toast({
        title: "Request Submitted!",
        description: "Our team will contact you within 24 hours to schedule a call.",
      });
      form.reset();
    } catch (err: any) {
      toast({
        title: "Failed to submit",
        description: err.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <main className="relative z-10 pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Home
            </Link>
          </motion.div>

          <SectionHeading
            badge="Start Your Project"
            title="Book a Call"
            subtitle="Tell us about your project and we'll schedule a call to discuss how we can help"
          />

          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-16 rounded-3xl bg-card/30 border border-border/30 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <CheckCircle className="w-20 h-20 text-primary mx-auto mb-6" />
              </motion.div>
              <h3 className="text-2xl font-display font-bold mb-4">Request Submitted Successfully!</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">
                Thank you for your interest in working with Zynalixx. Our team will review your project details 
                and contact you within 24 hours to schedule a call.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-secondary"
                  >
                    Back to Home
                  </motion.button>
                </Link>
                <Link to="/projects">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary"
                  >
                    Explore Our Work
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 md:p-10 rounded-3xl bg-card/30 border border-border/30"
            >
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Name *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="John Doe"
                                className="bg-muted/30 border-border focus:border-primary"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your Company (Optional)"
                                className="bg-muted/30 border-border focus:border-primary"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="john@example.com"
                                className="bg-muted/30 border-border focus:border-primary"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="+91 9876543210"
                                className="bg-muted/30 border-border focus:border-primary"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="pt-4 border-t border-border/50">
                    <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Project Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <FormField
                        control={form.control}
                        name="projectType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-muted/30 border-border">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-card border-border">
                                {projectTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget Range *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-muted/30 border-border">
                                  <SelectValue placeholder="Select budget" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-card border-border">
                                {budgetRanges.map((budget) => (
                                  <SelectItem key={budget} value={budget}>
                                    {budget}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="timeline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timeline *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-muted/30 border-border">
                                  <SelectValue placeholder="Select timeline" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-card border-border">
                                {timelines.map((timeline) => (
                                  <SelectItem key={timeline} value={timeline}>
                                    {timeline}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-5">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Description *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us about your project... What problem are you trying to solve? What features do you need? Any specific requirements or inspirations?"
                                rows={6}
                                className="bg-muted/30 border-border focus:border-primary resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-primary h-14 text-lg"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                          />
                          Submitting...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send size={20} />
                          Submit Project Request
                        </span>
                      )}
                    </Button>
                    <p className="text-center text-muted-foreground text-sm mt-4">
                      We'll contact you within 24 hours to schedule a call
                    </p>
                  </div>
                </form>
              </Form>
            </motion.div>
          )}
        </div>
      </main>
    </PageTransition>
  );
};

export default BookCall;
