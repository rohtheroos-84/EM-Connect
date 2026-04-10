package com.emconnect.api.repository;

import com.emconnect.api.entity.WeeklyDigestDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WeeklyDigestDeliveryRepository extends JpaRepository<WeeklyDigestDelivery, Long> {

    Optional<WeeklyDigestDelivery> findByUserIdAndPeriodStartAndPeriodEnd(Long userId, LocalDate periodStart, LocalDate periodEnd);

    List<WeeklyDigestDelivery> findByStatusAndPeriodEndGreaterThanEqual(String status, LocalDate periodEnd);
}
