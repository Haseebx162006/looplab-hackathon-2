"use client";

import React from "react";
import { Navbar } from "./Navbar";
import { ExploreButton } from "./ExploreButton";
import { HeroHeadline } from "./HeroHeadline";
import { CourseOfferingsCard } from "./CourseOfferingsCard";
import { StudentsChartCard } from "./StudentsChartCard";
import { InstructorBadge } from "./InstructorBadge";
import { TopicTagCloud } from "./TopicTagCloud";
import { RobotHeroVisual } from "./RobotHeroVisual";
import { WhyChooseSection } from "./WhyChooseSection";

export const HeroSection: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-[#F5F2FA] p-3 sm:p-6 flex flex-col justify-between">
      {/* Main Lavender Container */}
      <div className="relative w-full max-w-7xl mx-auto bg-[#D8CBEB] rounded-[36px] overflow-hidden shadow-2xl border border-white/60 flex flex-col justify-between min-h-[740px]">

        {/* Top Navbar */}
        <Navbar />

        {/* Background Visual Layer (Robot Image) */}
        <RobotHeroVisual />

        {/* Main Content Grid */}
        <div className="relative z-20 px-6 sm:px-10 py-4 flex-1 flex flex-col justify-between">
          
          {/* Top Row: Explore Button (Left) & Headline (Right) */}
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 pt-2">
            {/* Top Left Explore Pill */}
            <div className="z-20">
              <ExploreButton />
            </div>

            {/* Top Right Headline & CTA */}
            <div className="z-20 self-end md:self-auto">
              <HeroHeadline />
            </div>
          </div>

          {/* Middle/Bottom Row: Floating Cards & Interactive Elements */}
          <div className="flex flex-col lg:flex-row items-end justify-between gap-6 pt-10 pb-4">
            
            {/* Left Column: Offerings Card & Chart Card side-by-side or stacked */}
            <div className="flex flex-col sm:flex-row items-center gap-4 z-20 w-full lg:w-auto">
              <CourseOfferingsCard />
              <StudentsChartCard />
            </div>

            {/* Right Column: Tag Cloud Pills */}
            <div className="z-20 w-full lg:w-auto flex justify-end">
              <TopicTagCloud />
            </div>
          </div>

          {/* Bottom Pill Badge Row (Kate Johns instructor badge) */}
          <div className="z-20 pt-2 pb-2">
            <InstructorBadge />
          </div>
        </div>
      </div>

      {/* Why Choose Section Below Hero Card */}
      <WhyChooseSection />
    </div>
  );
};
