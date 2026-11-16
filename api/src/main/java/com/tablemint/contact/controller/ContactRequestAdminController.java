package com.tablemint.contact.controller;

import com.tablemint.common.error.DomainException;
import com.tablemint.common.error.ErrorCode;
import com.tablemint.contact.model.ContactRequestStatus;
import com.tablemint.contact.service.ContactRequestService;
import com.tablemint.contact.service.ContactRequestService.ContactRequestDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/admin/contact-requests", "/api/v1/admin/contact-requests"})
@PreAuthorize("hasAnyRole('OWNER', 'MODERATOR')")
public class ContactRequestAdminController {

    private final ContactRequestService contactRequestService;

    public ContactRequestAdminController(ContactRequestService contactRequestService) {
        this.contactRequestService = contactRequestService;
    }

    public record UpdateContactRequestBody(
            @NotNull ContactRequestStatus status
    ) {}

    @GetMapping
    public ResponseEntity<List<ContactRequestDto>> listContactRequests(Authentication authentication) {
        if (authentication == null) {
            throw new DomainException(ErrorCode.UNAUTHENTICATED);
        }
        return ResponseEntity.ok(contactRequestService.listContactRequests(authentication.getName()));
    }

    @PatchMapping("/{contactRequestId}")
    public ResponseEntity<ContactRequestDto> updateContactRequest(
            @PathVariable UUID contactRequestId,
            @Valid @RequestBody UpdateContactRequestBody req,
            Authentication authentication
    ) {
        if (authentication == null) {
            throw new DomainException(ErrorCode.UNAUTHENTICATED);
        }
        return ResponseEntity.ok(
                contactRequestService.updateContactRequestStatus(contactRequestId, req.status(), authentication.getName())
        );
    }
}
