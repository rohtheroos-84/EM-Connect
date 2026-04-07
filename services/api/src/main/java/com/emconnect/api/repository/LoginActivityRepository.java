package com.emconnect.api.repository;

import com.emconnect.api.entity.LoginActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoginActivityRepository extends JpaRepository<LoginActivity, Long> {

    List<LoginActivity> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);

    Page<LoginActivity> findByUserIdOrderByCreatedAtAsc(Long userId, Pageable pageable);

    long countByUserId(Long userId);
}
